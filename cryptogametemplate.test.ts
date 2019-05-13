import RestClient from '../src/network/rest/restClient';
import { Address} from './../src/crypto';
import { PrivateKey } from './../src/crypto/PrivateKey';
import { WebsocketClient } from './../src/network/websocket/websocketClient';
import { signTransaction, makeInvokeTransaction} from './../src/transaction/transactionBuilder';
import { hexstr2str, reverseHex,} from './../src/utils';
import { Parameter, ParameterType} from '../src/smartcontract/abi/parameter';


describe('test_supporting', () => {
    const ONT_CONTRACT = '0000000000000000000000000000000000000001';
    const ONG_CONTRACT = '0000000000000000000000000000000000000002';
    const private1 = new PrivateKey('f00dd7f5356e8aee93a049bdccc44ce91169e07ea3bec9f4e0142e456fd39bae');
    const private2 = new PrivateKey('da213fb4cb1b12269c20307dadda35a7c89869c0c791b777fd8618d4159db99c');
    const private3 = new PrivateKey('fe2e6bf548c30569185a5a70f6b7e7005b477f3e4164686a2758d2d765bb3485');

    const address1 = new Address('ASUwFccvYFrrWR6vsZhhNszLFNvCLA5qS6');
    const address2 = new Address('AWf8NiLzXSDf1JB2Ae6YUKSHke4yLHMVCm');
    const address3 = new Address('ANTPeXCffDZCaCXxY9u2UdssB2EYpP4BMh');
    const codeHash = 'c9dd2e1b95f88def5a7cacf1072255cc86ec9d86';

    const contractAddr = new Address(reverseHex(codeHash));
    // const Invoke = new scInvoke(contractAddr);
    const gasPrice = '500';
    const gasLimit = '200000';
    // const url = TEST_ONT_URL.REST_URL;
    const url = 'http://127.0.0.1:'
    // const url = 'http://polaris1.ont.io:';
    // const url = 'http://138.91.6.125:';
    const restClient = new RestClient(url + '20334');
    const socketClient = new WebsocketClient(url + '20335');


    test('test_deposit',  async () => {
        const method = 'deposit';
        let params = [
            new Parameter('address',ParameterType.ByteArray, address1.serialize()),
            new Parameter('amount',ParameterType.Integer, 123456789),
            new Parameter('ontOrOng',ParameterType.Integer, 1),
            new Parameter('userId',ParameterType.String, 'id:010203040506070809')
        ]
        var tx = makeInvokeTransaction(method, params, contractAddr,'500', '20000', address1)
        // console.log('makeInvokeTransaction, tx==', JSON.stringify(tx));
        signTransaction(tx, private1);
        const result = await socketClient.sendRawTransaction(tx.serialize(), false, true);
        console.log('result is ' + JSON.stringify(result));
        let resNotify = parseNotify(method, result);
        console.log('resNotify is ' + JSON.stringify(resNotify));
        
    });
    test('test_preWithdraw', async() => {
        const method = 'preWithdraw';
        let params = [
            new Parameter('address',ParameterType.ByteArray, address1.serialize()),
            new Parameter('amount',ParameterType.Integer, 123456789),
            new Parameter('ontOrOng',ParameterType.Integer, 1),
            new Parameter('userId',ParameterType.String, 'id:010203040506070809')
        ]
        var tx = makeInvokeTransaction(method, params, contractAddr,'500', '20000', address1)
        // console.log('makeInvokeTransaction, tx==', JSON.stringify(tx));
        signTransaction(tx, private1);
        const result = await socketClient.sendRawTransaction(tx.serialize(), false, true);
        console.log('result is ' + JSON.stringify(result));
        let resNotify = parseNotify(method, result);
        console.log('resNotify is ' + JSON.stringify(resNotify));
    });

    test('test_checkIn', async() => {
        const method = 'checkIn';
        let params = [
            new Parameter('address',ParameterType.ByteArray, address1.serialize()),
            new Parameter('userId',ParameterType.String, 'id:010203040506070809')
        ]
        var tx = makeInvokeTransaction(method, params, contractAddr,'500', '20000', address1)
        // console.log('makeInvokeTransaction, tx==', JSON.stringify(tx));
        signTransaction(tx, private1);
        const result = await socketClient.sendRawTransaction(tx.serialize(), false, true);
        console.log('result is ' + JSON.stringify(result));
        let resNotify = parseNotify(method, result);
        console.log('resNotify is ' + JSON.stringify(resNotify));
    }, 10000);
    test('test_canCheckIn', async() => {
        const method = 'canCheckIn';
        let params = [
            new Parameter('address',ParameterType.ByteArray, address1.serialize()),
        ]
        const tx = makeInvokeTransaction(method, params, contractAddr);
        const res = await restClient.sendRawTransaction(tx.serialize(), true);
        console.log('test_canCheckIn is : ' +JSON.stringify(res));
        
        const val = res.Result.Result ? parseInt(reverseHex(res.Result.Result), 16) : 0;
        if (val == 0 ) {
            console.log("canCheckIn res is " + val + ", means: Cannot checkIn")
        } else if (val > 0) {
            console.log("canCheckIn res is " + val + ", means: Can checkIn")
        }
    });
    test('test_withdraw', async () => {
        const adminAddr = new Address('AQf4Mzu1YJrhz9f3aRkkwSm9n3qhXGSh4p');
        const adminPrivateKey = new PrivateKey('5f2fe68215476abb9852cfa7da31ef00aa1468782d5ca809da5c4e1390b8ee45');
        const method = 'withdraw';
        let address, privateKey;
        let flag = 1;
        if (flag == 1) {
            address = adminAddr;
            privateKey = adminPrivateKey;
        } else {
            address = address1;
            privateKey = private1;
        }        
        let params = [
            new Parameter('to',ParameterType.ByteArray, address.serialize()),
            new Parameter('amount',ParameterType.Integer, 100),
            new Parameter('ontOrOng',ParameterType.Integer, 1),
        ]
        var tx = makeInvokeTransaction(method, params, contractAddr,'500', '20000', address)
        // console.log('makeInvokeTransaction, tx==', JSON.stringify(tx));
        signTransaction(tx, privateKey);
        const result = await socketClient.sendRawTransaction(tx.serialize(), false, true);
        console.log('result is ' + JSON.stringify(result));
        let resNotify = parseNotify(method, result);
        console.log('resNotify is ' + JSON.stringify(resNotify));
    });
   
    
    function parseNotify(action, result) {
        let resNotify = [];
        if (result.Result.State == 1) {
            const notifys = result.Result.Notify;
            let notify, addr, amount, asset, time, userId;
            for (let i = 0; i < notifys.length; i++) {
                notify = notifys[i];
                if (notify.ContractAddress == codeHash) {
                    let state = notify.States;
                    let method = hexstr2str(state[0]);
                    resNotify.push(action);
                    switch (method) {
                    case 'checkIn':
                        addr = new Address(state[1]).toBase58();
                        resNotify.push(addr);
                        userId = hexstr2str(state[2]);
                        resNotify.push(userId);
                        time = parseInt(reverseHex(state[3]), 16);
                        resNotify.push(time);
                        break;
                    case 'preWithdraw':
                    case 'deposit':
                        addr = new Address(state[1]).toBase58();
                        resNotify.push(addr);
                        amount = parseInt(reverseHex(state[2]), 16);
                        resNotify.push(amount);
                        asset = hexstr2str(state[3]);
                        resNotify.push(asset)
                        time = parseInt(reverseHex(state[4]), 16);
                        resNotify.push(time);
                        userId = hexstr2str(state[5]);
                        resNotify.push(userId);
                        break;
                    case 'withdraw':
                        addr = new Address(state[1]).toBase58();
                        resNotify.push(addr);
                        amount = parseInt(reverseHex(state[2]), 16);
                        resNotify.push(amount);
                        asset = hexstr2str(state[3]);
                        resNotify.push(asset)
                        time = parseInt(reverseHex(state[4]), 16);
                        resNotify.push(time);
                        break;
                    }
                    
                    
                }
            }
        }
        return resNotify;
    }

});


