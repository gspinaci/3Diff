[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# 3Diff
**3Diff** is a model that is used over the edits of textual documents.

## 1. Three level format
Normally, every Diff algorithm will give as output. This algorithm will give more informations about diffs, using these following three levels.

1. **MECHANICAL LEVEL**: 2 operations, `INS` and `DEL`, only over text (markup is considered as text)
2. **STRUCTURAL LEVEL**: 6 operations over text, 9 operations over structure.
3. **SEMANTIC LEVEL**: Different operations (TBD)

## 2. Mechanical operations

There are only two operations: `INS`and `DEL`. The name is made up of only 3 letters in order to distinguish it from the more significant operations. Mechanical operations operate **EXCLUSIVELY** at string level: operations over markup are always expressed as `INS` and `DEL` over string containing markup. 

Optionally, they can have informations about author and timestamp. Ids are severely sequential, global (independently from version).

### 2.1 INS

A string of characters insertion (markup included).

```
{
  "id": "edit-00001",
  "op": "INS",
  "pos": 80,
  "content": "nuovo"
}
{
  "id": "edit-00003",
  "op": "INS",
  "pos": 100,
  "content": "</p><p>"
}
{
  "id": "edit-00005",
  "op": "INS",
  "by": "Fabio Vitali",
  "timestamp": "2018-03-10T07:25:23.891Z", 
  "pos": 120,
  "content": "new content"
}
```

### 2.2 DEL

A string of characters deletion (markup included).

```
{
  "id": "edit-00002",
  "op": "DEL",
  "pos": 90,
  "content": "vecchio"
}
{
  "id": "edit-00004",
  "op": "DEL",
  "pos": 110,
  "content": "part of the first paragraph.<p>Part of "
}
{
  "id": "edit-00006",
  "op": "DEL",
  "by": "Fabio Vitali",
  "timestamp": "2018-03-10T07:25:23.891Z", 
  "pos": 130,
  "content": "old content"
}
```

## 3. Structural operations

These are operations at structural level. These are sequence of mechanical operations that have a proper sense on the document even if they occurr in different places of the document.

The structural operations can occur inside a unique text node or on a complex markup structure (e.g. a `WRAP` occur atomically even if it corresponds to two dependant `INSERT`). This means that timestamp and author of structural operations are **necessary** and they are applied to all of the nested mechanical operations without specifying it.

**N.B.** The same structural operation can be have two or more sequence of mechanical operations with the same effect. E.g. The operation `WORDREPLACE` *word -> words* can be seen as: `INS` of *s* or `DEL` of *word* plus `INS` of *words*.
These operations are structurally equivalent.

## 3.1 Operations over text

The operations that occur inside a the same markup node are textual. If the operation act over more than one markup node, even if it is similar to a textual operaton, if must be considere as a structure operation. The operations over text are inside a word (only if they fix the spelling), operation on word or operation over more words.

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

## TODO list

### 1. WORDREPLACE

In order to handle it, we should use wordnet APIs for the synset. Use something else for verbal forms (e.g. have -> has).

### 2. Semantic operations

Handle all of the semantic operations

### 3. Handle unbalanced diffs

Handle 

### 4. Handle text and structure in single diff

When we face a situation like the following one ()



### 4. Save old and new in structural diff
