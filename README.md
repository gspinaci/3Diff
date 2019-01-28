[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# 3Diff
**3Diff** is a model that is used over the edits of textual documents.

## Three level format
Normally, every Diff algorithm will give as output. This algorithm will give more informations about diffs, using these following three levels.

1. **MECHANICAL LEVEL**: 2 operations, `INS` and `DEL`, only over text (markup is considered as text)
2. **STRUCTURAL LEVEL**: 6 operations over text, 9 operations over structure.
3. **SEMANTIC LEVEL**: Different operations (TBD)

## Mechanical operations

### INS

### DEL

## Structural operations (text)

### PUNCTUATION

### WORDCHANGE

### WORDREPLACE

currently missing

### TEXTINSERT / TEXTDELETE

### TEXTREPLACE

## Structural operations (structure)

### NOOP

### INSERT / DELETE

### MOVE

### WRAP / UNWRAP

### JOIN / SPLIT

### REPLACE

## Semantic operations

# Usage

The current version of **3Diff** is based on the [google/diff-match-patch](https://github.com/google/diff-match-patch) algorithm. **3Diff** will be also build on top of other algorithms.

You can easily change the algorithm by choosing it from the class invocation.

### Declare the algorithm

You can define the algorithm using the list of pre-defined ones.

`const algorithm = new DiffAlgorithmSelector(oldText, newText, DiffAlgorithmSelector.algorithms.diffMatchPatch)`

**parameters:**

* `oldText` is the old version of the text;
* `newText` is the new version of the text;
* `algorithm` is the algorithm that is used to create the list of mechanical diffs.

The currently supported algorithms are the following
```
DiffAlgorithmSelector.algorithms = {
  diffMatchPatch: 'diff_match_patch'
}
```

The constructor of the class `DiffAlgorithmSelector` returns the Adapter.

**N.B. All positions will be always related to the newText.**

## DiffAlgorithmSelector functions

Once you have create the algorithm, there is a set of functions you can call on it:

### getMechanicalOperation() --> JSON

This function returns the list of mechanical operations.

**Example**

```
[
  {
    "id": "EDIT-0001",
    "op": "DEL",
    "content": "B",
    "pos": 118
  },
  {
    "id": "EDIT-0002",
    "op": "INS",
    "content": "C",
    "pos": 118
  }
]
```

### getStructuralOperations() --> JSON

This function returns the list of structural operations.

**Example**

```
[
  {
    "id": "STRUCTURAL-0001",
    "op": "WORDCHANGE",
    "by": "USER-0001",
    "timestamp": 1548681302681,
    "items": [
      {
        "id": "EDIT-0001",
        "op": "DEL",
        "content": "B",
        "pos": 118
      },
      {
        "id": "EDIT-0002",
        "op": "INS",
        "content": "C",
        "pos": 118
      }
    ],
    "new": "AlternC",
    "old": "AlternB"
  }
]
```

### getSemanticOperations() --> JSON

This function returns the list of semantic operations

**Example**

```
[
  {
    "id": "SEMANTIC-0001",
    "op": "EDITCHAIN",
    "items": [
      {
        "id": "STRUCTURAL-0001",
        "op": "WORDCHANGE",
        "by": "USER-0001",
        "timestamp": 1548681302681,
        "items": [
          {
            "id": "EDIT-0001",
            "op": "DEL",
            "content": "B",
            "pos": 118
          },
          {
            "id": "EDIT-0002",
            "op": "INS",
            "content": "C",
            "pos": 118
          }
        ],
        "new": "AlternC",
        "old": "AlternB"
      },
      {
        "id": "STRUCTURAL-0018",
        "op": "WORDCHANGE",
        "by": "USER-0001",
        "timestamp": 1548681304896,
        "items": [
          {
            "id": "EDIT-0051",
            "op": "DEL",
            "content": "B",
            "pos": 3465
          },
          {
            "id": "EDIT-0052",
            "op": "INS",
            "content": "C",
            "pos": 3465
          }
        ],
        "new": "AlternC",
        "old": "AlternB"
      }
    ]
  }
]
```

## Node.js wrapper

TBD

## Create a new Adapter

TBD
