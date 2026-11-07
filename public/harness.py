"""Test harness shared by the in-browser Pyodide worker and scripts/validate-content.mjs.

rtpm_run(code, spec_json) -> JSON string:
  {"error": str|None, "results": [{"ok", "hidden", "input", "expected", "actual", "error", "stdout", "ms"}]}
"""
import json, io, time, traceback, contextlib, copy, sys


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def __repr__(self):
        return "ListNode(%s)" % from_list_node(self)


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def to_list_node(arr):
    head = None
    for v in reversed(arr or []):
        head = ListNode(v, head)
    return head


def from_list_node(node, limit=10000):
    out = []
    while node is not None and len(out) < limit:
        out.append(node.val)
        node = node.next
    return out


def to_tree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q, i = [root], 1
    while q and i < len(arr):
        n = q.pop(0)
        if i < len(arr) and arr[i] is not None:
            n.left = TreeNode(arr[i]); q.append(n.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            n.right = TreeNode(arr[i]); q.append(n.right)
        i += 1
    return root


def from_tree(root):
    if root is None:
        return []
    out, q = [], [root]
    while q:
        n = q.pop(0)
        if n is None:
            out.append(None)
        else:
            out.append(n.val); q.append(n.left); q.append(n.right)
    while out and out[-1] is None:
        out.pop()
    return out


TO = {"listnode": to_list_node, "tree": to_tree, "listnodes": lambda arr: [to_list_node(x) for x in arr]}
FROM = {"listnode": from_list_node, "tree": from_tree}


def _key(v):
    return json.dumps(v, sort_keys=True, default=repr)


def _nested(v):
    if isinstance(v, (list, tuple)):
        return sorted((_nested(i) for i in v), key=_key)
    return v


def _equal(actual, expected, mode):
    if actual is None or expected is None:
        return actual is expected
    if mode == "unordered":
        try:
            return sorted(actual, key=_key) == sorted(expected, key=_key)
        except TypeError:
            return False
    if mode == "unordered_nested":
        return _nested(actual) == _nested(expected)
    if mode == "float":
        try:
            return abs(actual - expected) < 1e-5
        except TypeError:
            return False
    if mode == "set":
        return set(actual) == set(expected)
    return actual == expected


def _jsonable(v):
    try:
        json.dumps(v)
        return v
    except Exception:
        return repr(v)


def _user_traceback(exc):
    frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == "<solution>"]
    lines = []
    if frames:
        lines.append("Traceback (most recent call last):")
        lines += traceback.format_list(frames)
    lines += traceback.format_exception_only(type(exc), exc)
    return "".join(lines).strip()


def _prelude(ns):
    exec(
        "from typing import *\nimport collections, heapq, bisect, math, itertools, functools, string, re\n"
        "from collections import *\nfrom heapq import *\nfrom bisect import *\nfrom functools import *\nfrom itertools import *\nfrom math import *\n",
        ns,
    )
    ns["ListNode"] = ListNode
    ns["TreeNode"] = TreeNode


def rtpm_run(code, spec_json):
    spec = json.loads(spec_json)
    ns = {"__name__": "__solution__"}
    _prelude(ns)
    res = {"error": None, "results": []}
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(code, "<solution>", "exec"), ns)
    except BaseException as e:  # noqa
        res["error"] = _user_traceback(e)
        return json.dumps(res)

    kind = spec.get("kind", "function")
    mode = spec.get("compare", "exact")
    arg_types = spec.get("argTypes") or []
    ret_type = spec.get("retType")
    inplace = spec.get("inplace")  # index of arg to compare after the call

    target = None
    if kind == "function":
        fn = spec["fn"]
        if fn in ns:
            target = ns[fn]
        elif "Solution" in ns and hasattr(ns["Solution"], fn):
            target = getattr(ns["Solution"](), fn)
        else:
            res["error"] = "Could not find a function named `%s`. Keep the name from the starter code." % fn
            return json.dumps(res)
    else:
        cls = ns.get(spec["className"])
        if cls is None:
            res["error"] = "Could not find a class named `%s`." % spec["className"]
            return json.dumps(res)

    for t in spec["tests"]:
        item = {"ok": False, "hidden": bool(t.get("hidden")), "input": None, "expected": None,
                "actual": None, "error": None, "stdout": "", "ms": 0}
        out = io.StringIO()
        start = time.perf_counter()
        try:
            with contextlib.redirect_stdout(out):
                if kind == "function":
                    raw = t["args"]
                    item["input"] = raw
                    args = copy.deepcopy(raw)
                    for i, ty in enumerate(arg_types):
                        if ty and i < len(args):
                            args[i] = TO[ty](args[i])
                    ret = target(*args)
                    if inplace is not None:
                        a = args[inplace]
                        ty = arg_types[inplace] if inplace < len(arg_types) else None
                        actual = FROM[ty](a) if ty else a
                    else:
                        actual = FROM[ret_type](ret) if ret_type else ret
                    expected = t["expected"]
                    item["expected"] = expected
                    item["actual"] = _jsonable(actual)
                    item["ok"] = _equal(actual, expected, mode)
                else:
                    ops, argl, exp = t["ops"], t["args"], t["expected"]
                    item["input"] = [[o] + list(a) for o, a in zip(ops, argl)]
                    obj = cls(*argl[0])
                    actual = [None]
                    for o, a in zip(ops[1:], argl[1:]):
                        actual.append(getattr(obj, o)(*a))
                    item["expected"] = exp
                    item["actual"] = _jsonable(actual)
                    item["ok"] = all(_equal(x, y, mode) for x, y in zip(actual, exp)) and len(actual) == len(exp)
        except BaseException as e:  # noqa
            item["error"] = _user_traceback(e)
        item["ms"] = round((time.perf_counter() - start) * 1000, 2)
        so = out.getvalue()
        item["stdout"] = so[:1500] + ("…" if len(so) > 1500 else "")
        res["results"].append(item)
    return json.dumps(res, default=repr)
