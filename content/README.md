# Content schema

## Lesson (`content/lessons/*.yaml`, list of)
```yaml
- id: unique-id
  track: python | algo | design | system | behavioral
  week: 1            # 1-12, where it sits in the study plan
  title: ...
  summary: ...
  minutes: 10
  xp: 25
  requires: [other-lesson-id]   # soft prerequisites
  sections:
    - md: "markdown text"
    - code: "runnable python"       # executed by `npm run validate` too
      java: "optional Java equivalent shown in a tab"
      caption: "optional"
      expectError: true             # snippet intentionally raises
  template: "python skeleton to memorise (algo patterns)"
  quiz: [{q, options: [..], answer: index, why}]
```

## Problem (`content/problems/*.yaml`, list of)
```yaml
- id: unique-id
  title: ...
  pattern: lesson-id           # the algo lesson it trains
  difficulty: easy | medium | hard
  leetcode: https://leetcode.com/problems/...
  fn: function_name            # or kind: design + className: Foo
  compare: exact | unordered | unordered_nested | float | set
  argTypes: [listnode, tree, null]   # convert JSON args into ListNode / TreeNode
  retType: listnode | tree
  inplace: 0                   # compare the mutated argument at this index instead of the return value
  statement: markdown
  starter: python
  tests: [{args: [...], expected: ..., hidden: true}]
  # design problems: tests: [{ops: [Cls, m1, m2], args: [[ctor args], [..], [..]], expected: [null, ..]}]
  hints: [..]
  solution: python (must pass all tests)
  complexity: "O(n) time, O(1) space"
  explain: markdown
```
LeetCode statements are copyrighted; write original statements and link to the LeetCode problem.
