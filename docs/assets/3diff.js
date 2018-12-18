/* eslint-disable no-unused-vars */
// List of diff types
const diffType = {
  mechanical: {
    id: 'edit',
    ins: 'INS',
    del: 'DEL'
  },
  structural: {
    id: 'structural',
    punctuation: 'PUNCTUATION',
    textInsert: 'TEXTINSERT',
    textDelete: 'TEXTDELETE',
    wordchange: 'WORDCHANGE'
  },
  semantic: {
    id: 'semantic'
  },
  newTextId: 'new',
  oldTextId: 'old'
}

// List of algorithms
const algorithms = {
  diffMatchPatch: 'diff_match_patch'
}

const regexp = {
  // A single punctuation with a optional following \s (space)
  // and an optional following A-z (capitalized or not character)
  punctuation: /^\W[\s]?[A-z]?$/,
  // No whitespaces
  wordchange: /^\S*$/
}

const TBD = 'TBD'
const globalUser = 'SAURON'

/**
 *
 *
 * @class DiffAlgorithmSelector
 */
class DiffAlgorithmSelector {
  /**
   * Creates an instance of DiffAlgorithmSelector.
   * @param {String} type
   * @memberof DiffAlgorithmSelector
   *
   * Returns the right type of algorithm
   */
  constructor (oldText, newText, type) {
    let result

    switch (type) {
      case algorithms.diffMatchPatch:
        result = new DiffMatchPatchAdapter(oldText, newText)
        break
      default:
        result = null
    }
    return result
  }
}

/**
 *
 *
 * @class Adapter
 */
class Adapter {
  constructor (oldText, newText) {
    this.oldText = oldText
    this.newText = newText
  }
  /**
   *
   *
   * @param {*} listMechanicalOperations
   * @memberof Adapter
   */
  makeDiff (listMechanicalOperations) {
    this.threeDiff = new ThreeDiff(listMechanicalOperations, this.oldText, this.newText)
  }

  /**
   *
   *
   * @returns
   * @memberof Adapter
   */
  getMechanicalOperations () {
    return this.threeDiff.getMechanicalOperations()
  }

  /**
   *
   *
   * @returns
   * @memberof Adapter
   */
  getStructuralOperations () {
    return this.threeDiff.getStructuralOperations()
  }
}

/**
 *
 *
 * @class DiffMatchPatchAdapter
 * @extends {Adapter}
 *
 * https://github.com/google/diff-match-patch/wiki/API
 *
 * This class contains the logic for handling the output of this algorithm
 * and creates the input structure of mechanical modifications for the 3Diff class
 */
class DiffMatchPatchAdapter extends Adapter {
  constructor (oldText, newText) {
    // Save texts
    super(oldText, newText)

    /* eslint-disable new-cap */
    let dmp = new diff_match_patch()
    /* eslint-enable new-cap */

    this.diffs = dmp.diff_main(oldText, newText)

    // Cleanup semantic
    // https://github.com/google/diff-match-patch/wiki/API#diff_cleanupsemanticdiffs--null
    dmp.diff_cleanupSemantic(this.diffs)

    // Get Patches
    // https://github.com/google/diff-match-patch/wiki/API#patch_makediffs--patches
    this.patches = dmp.patch_make(this.diffs)

    // Execute the run algorithm
    this.runDiffAlgorithm()
  }

  /**
   *
   *
   * @returns
   * @memberof DiffMatchPatchAdapter
   */
  runDiffAlgorithm () {
    this.makeDiff(this._getMechanicalOps())
  }

  /**
   *
   *
   * @memberof DiffMatchPatchAdapter
   */
  _getMechanicalOps () {
    // Create a temporary list of diffs
    let newDiffs = []

    // Iterate over patches
    for (let patch of this.patches) {
      // Set the absolute index
      let absoluteIndex = patch['start1']
      let diffs = patch['diffs']

      // Iterate over diffs
      diffs.map((diff, index) => {
        // Increase the current index by the length of current element, if it wasn't a DEL
        if (index > 0) {
          let previous = diffs[index - 1]
          if (previous[0] !== -1) {
            absoluteIndex += parseInt(previous[1].length)
          }
        }
        // Not_changed status doesn't matter
        if (diff[0] !== 0) {
          // Get mechanical type
          let op = diff['0'] === 1 ? diffType.mechanical.ins : diffType.mechanical.del

          // Update diffs
          newDiffs.push(new MechanicalDiff(op, diff['1'], absoluteIndex, newDiffs.length))
        }
      })
    }
    return newDiffs
  }
}

/**
 *
 *
 * @class Diff
 */
class Diff {
  /**
   *Creates an instance of Diff.
   * @param {*} type
   * @param {*} lastId
   * @memberof Diff
   */
  constructor (type, lastId) {
    this.id = this._setId(type, lastId)
  }

  /**
   *
   *
   * @param {*} type
   * @param {*} lastId
   * @returns id
   * @memberof Diff
   */
  _setId (type, lastId) {
    // Update the lastId
    lastId++

    // Start to create the new id
    let id = `${type}-`

    // Add the right amount of 0 before the new id
    let tmp = lastId.toString()
    let max = 4 - tmp.length
    while (max > 0) {
      id += '0'
      max--
    }
    return id + lastId
  }

  /**
   *
   *
   * @param {*} newText
   * @returns context
   * @memberof Diff
   *
   *     = - = = = +
   * eg: w o r l d s
   *     0 1 2 3 4 5
   */
  _getContext (text) {
    // Get left and right context
    let leftContext = text.substring(0, this.pos)
    let rightContext = text.substring(this.op === diffType.mechanical.ins ? this.pos + this.content.length : this.pos, text.length)

    // Get only the current word
    leftContext = leftContext.split(/\s/)[leftContext.split(/\s/).length - 1]
    rightContext = rightContext.split(/\s/)[0]

    if (this.op === diffType.mechanical.ins) { leftContext += this.content }

    let contenxt = leftContext + rightContext

    return contenxt
  }
}

/**
 *
 *
 * @class MechanicalDiff
 * @extends {Diff}
 */
class MechanicalDiff extends Diff {
  /**
   *Creates an instance of MechanicalDiff.
   * @param {*} operation
   * @param {*} content
   * @param {*} position
   * @param {*} lastId
   * @memberof MechanicalDiff
   */
  constructor (operation, content, position, lastId) {
    super(diffType.mechanical.id, lastId)
    this.op = operation
    this.content = content
    this.pos = position
  }
}

/**
 *
 *
 * @class StructuralDiff
 * @extends {Diff}
 */
class StructuralDiff extends Diff {
  /**
   *Creates an instance of StructuralDiff.
   * @param {*} lastId
   * @param {*} item
   * @param {*} [by=globalUser]
   * @memberof StructuralDiff
   */
  constructor (lastId, item, by = globalUser) {
    super(diffType.structural.id, lastId)
    this.op = TBD
    this.by = by
    this.timestamp = Date.now()
    this.items = [item]
  }

  /**
   *
   *
   * @param {*} operation
   * @memberof StructuralDiff
   */
  setOperation (operation) {
    this.op = operation
  }

  /**
   *
   *
   * @param {*} item
   * @memberof StructuralDiff
   */
  addItem (item) {
    this.items.push(item)
  }
}

/**
 *
 *
 * @class ThreeDiff
 */
class ThreeDiff {
  /**
   *Creates an instance of ThreeDiff.
   * @param {*} listMechanicalOperations
   * @param {*} oldText
   * @param {*} newText
   * @memberof ThreeDiff
   */
  constructor (listMechanicalOperations, oldText, newText) {
    // Save the list of all the mechanical operations
    this.listMechanicalOperations = listMechanicalOperations
    this.listStructuralOperations = []
    this.listSemanticOperations = []

    // Save the texts
    this.oldText = oldText
    this.newText = newText

    // Initialise the structural rules
    this.structuralRules = [

      // Punctuation
      (leftDiff, rightDiff = null) => {
        // Block un coupled diffs
        if (rightDiff === null) return false
        // Both contents must match the regex
        return (RegExp(regexp.punctuation).test(leftDiff.content) &&
          RegExp(regexp.punctuation).test(rightDiff.content)
        ) &&

        // Positions must be equal
        (leftDiff.pos === rightDiff.pos) &&

        // Operations must be different
        (leftDiff.op !== rightDiff.op)
          ? diffType.structural.punctuation
          : false
      },

      // Word change
      (leftDiff, rightDiff = null) => {
        let leftContext = leftDiff._getContext(this.newText)

        // Two diffs
        if (rightDiff != null) {
          let rightContext = rightDiff._getContext(this.newText)

          return (RegExp(regexp.wordchange).test(leftContext) && RegExp(regexp.wordchange).test(rightContext) && (leftContext === rightContext))
            ? diffType.structural.wordchange
            : false
        // One single diff
        } else {
          return RegExp(regexp.wordchange).test(leftContext)
            ? diffType.structural.wordchange
            : false
        }
      },

      // TextInsert or TextDelete. They work only with one parameter
      (leftDiff, rightDiff = null) =>
        rightDiff === null
          ? leftDiff.op === diffType.mechanical.ins ? diffType.structural.textInsert : diffType.structural.textDelete
          : false
    ]

    // Execute the structural analysis
    this._executeStructuralAnalysis()
  }

  /**
   *
   *
   * @memberof ThreeDiff
   */
  _executeStructuralAnalysis () {
    // Copy the mechanicalOperations list
    let newListMechanicalOperations = this.listMechanicalOperations.slice(0)

    // Iterate over the list of mechanical operations
    const leftIndex = 0
    while (newListMechanicalOperations.length > 0) {
      // Set a matched rule
      let matchedRules = false

      // Remove the current diff from the list and get reference to it
      let leftDiff = newListMechanicalOperations.splice(leftIndex, 1)[0]

      // Create a placeholder structuralDiff
      let structuralDiff = new StructuralDiff(this.listStructuralOperations.length, leftDiff)

      for (let rightIndex = leftIndex; rightIndex < newListMechanicalOperations.length; rightIndex++) {
        let rightDiff = newListMechanicalOperations[rightIndex]

        // Iterate over rules
        for (let rule of this.structuralRules) {
          // If the current rule matches
          let ruleResult = rule(leftDiff, rightDiff)
          if (ruleResult !== false) {
            // Update operation type
            structuralDiff.setOperation(ruleResult)

            // Add the mechanical operation and add it
            structuralDiff.addItem(newListMechanicalOperations.splice(rightIndex, 1)[0])

            // There is a match
            matchedRules = true

            // Update index to continue inside the for boundaries
            rightIndex--

            // Don't call any other rule
            break
          }
        }
      }

      // Try all rules on only left diff
      if (!matchedRules) {
        for (let rule of this.structuralRules) {
          // Try the rules
          let ruleResult = rule(leftDiff)
          if (ruleResult !== false) {
            // Update operation type
            structuralDiff.setOperation(ruleResult)

            break
          }
        }
      }

      // Append the structural operation
      this.listStructuralOperations.push(structuralDiff)
    }
  }

  /**
   *
   *
   * @returns
   * @memberof ThreeDiff
   */
  getMechanicalOperations () {
    return this.listMechanicalOperations
  }

  /**
   *
   *
   * @returns
   * @memberof ThreeDiff
   */
  getStructuralOperations () {
    return this.listStructuralOperations
  }
}

/* eslint-enable no-unused-vars */
