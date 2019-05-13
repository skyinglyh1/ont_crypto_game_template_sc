OntCversion = '2.0.0'
"""
Entity Core
"""
from ontology.interop.Ontology.Contract import Migrate
from ontology.interop.System.App import RegisterAppCall, DynamicAppCall
from ontology.interop.System.Storage import GetContext, Get, Put, Delete
from ontology.interop.System.Runtime import CheckWitness, GetTime, Notify, Serialize, Deserialize
from ontology.interop.System.ExecutionEngine import GetExecutingScriptHash, GetScriptContainer
from ontology.interop.Ontology.Native import Invoke
from ontology.interop.Ontology.Runtime import Base58ToAddress, GetCurrentBlockHash
from ontology.builtins import concat, state, sha256, len, append
from ontology.interop.System.Transaction import GetTransactionHash
from ontology.libont import str, AddressFromVmCode
from ontology.interop.System.Action import RegisterAction
from ontology.interop.System.Blockchain import GetHeight, GetHeader, GetBlock

ONTAddress = bytearray(b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01')
ONGAddress = bytearray(b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02')
SelfContractAddress = GetExecutingScriptHash()

Admin = Base58ToAddress("AQf4Mzu1YJrhz9f3aRkkwSm9n3qhXGSh4p")

PLAYER_LAST_CHECK_IN_DAY = bytearray(b'\x01')
DaySeconds = 86400

def Main(operation, args):
    if operation == "deposit":
        assert (len(args) == 4)
        address = args[0]
        amount = args[1]
        ongOrOnt = args[2]
        userId = args[3]
        return deposit(address, amount, ongOrOnt, userId)
    if operation == "preWithdraw":
        assert (len(args) == 4)
        address = args[0]
        amount = args[1]
        ongOrOnt = args[2]
        userId = args[3]
        return preWithdraw(address, amount, ongOrOnt, userId)
    if operation == "checkIn":
        assert (len(args) == 2)
        address = args[0]
        userId = args[1]
        return checkIn(address, userId)
    if operation == "canCheckIn":
        assert (len(args) == 1)
        address = args[0]
        return canCheckIn(address)
    if operation == "withdraw":
        assert (len(args) == 3)
        to = args[0]
        amount = args[1]
        ongOrOnt = args[2]
        return withdraw(to, amount, ongOrOnt)
    return False

def deposit(address, amount, ongOrOnt, userId):
    """

    :param userId:
    :param address:
    :param amount: Depositing ONG, amount = 1 * 10^9 when we want to transfer ONG.
                   Depositing ONT, amount = 1 when we want to transfer ONT.
    :param ongOrOnt: 0 means ONT, 1 means ONG
    :return:
    """
    assert (CheckWitness(address))
    assert (amount > 0)
    assert (ongOrOnt == 1 or ongOrOnt == 0)
    asset = "ONG"
    nativeAssetHash = ONGAddress
    if ongOrOnt == 0:
        asset = "ONT"
        nativeAssetHash = ONTAddress
    assert (_transferNativeAsset(nativeAssetHash, address, SelfContractAddress, amount))
    Notify(["deposit", address, amount, asset, GetTime(), userId])
    return True


def preWithdraw(address, amount, ongOrOnt, userId):
    assert (CheckWitness(address))
    assert (amount > 0)
    assert (ongOrOnt == 1 or ongOrOnt == 0)
    asset = "ONG"
    if ongOrOnt == 0:
        asset = "ONT"
    Notify(["preWithdraw", address, amount, asset, GetTime(), userId])
    return True


def checkIn(address,userId):
    assert (CheckWitness(address))
    checkInDays = canCheckIn(address)
    assert (checkInDays > 0)
    Put(GetContext(), concat(PLAYER_LAST_CHECK_IN_DAY, address), checkInDays)

    Notify(["checkIn", address, userId, GetTime()])
    return True


def canCheckIn(address):
    """
    :param address:
    :return: return == 0 => can NOT check in.
              return > 0 => can check in.
    """
    lastTimeCheckIn = Get(GetContext(), concat(PLAYER_LAST_CHECK_IN_DAY, address))
    if not lastTimeCheckIn:
        return Div(GetTime(), DaySeconds)
    now = GetTime()
    days = Div(now, DaySeconds)
    if days > lastTimeCheckIn:
        return days
    else:
        return 0

def withdraw(to, amount, ongOrOnt):
    assert (CheckWitness(Admin))
    assert (ongOrOnt == 1 or ongOrOnt == 0)
    asset = "ONG"
    nativeAssetHash = ONGAddress
    if ongOrOnt == 0:
        asset = "ONT"
        nativeAssetHash = ONTAddress
    assert (_transferNativeAsset(nativeAssetHash, SelfContractAddress, to, amount))
    Notify(["withdraw", to, amount, asset, GetTime()])
    return True


def _transferNativeAsset(nativeAssetHash, fromAcct, toAcct, amount):
    """
    transfer native asset, including ont or ong
    :param fromacct:
    :param toacct:
    :param amount:
    :return:
    """
    param = state(fromAcct, toAcct, amount)
    res = Invoke(0, nativeAssetHash, 'transfer', [param])
    if res and res == b'\x01':
        return True
    else:
        return False

def Div(a, b):
    """
    Integer division of two numbers, truncating the quotient.
    """
    assert(b > 0)
    c = a / b
    return c