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
    wordchange: 'WORDCHANGE',
    textReplace: 'TEXTREPLACE',
    insert: 'INSERT',
    delete: 'DELETE',
    move: 'MOVE'
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
  punctuation: '^\\W[\\s]?[A-z]?$',

  // No whitespaces
  wordchange: '^\\S*$',

  // xml tags
  tagSelector: '<[.A-z]?[^(><.)]+>',

  // Text selector
  textSelector: '[A-z\\s]*',

  lowercaseLetter: '[a-z]+',

  tagElements: '[<>/?]'
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
  _getWord (oldText, newText) {
    // Get left and right context
    let leftContext = newText.substring(0, this.pos)
    let rightContext = newText.substring(this.op === diffType.mechanical.ins ? this.pos + this.content.length : this.pos, newText.length)

    // Get only the current word
    leftContext = leftContext.split(/\s/)[leftContext.split(/\s/).length - 1]
    rightContext = rightContext.split(/\s/)[0]

    if (this.op === diffType.mechanical.ins) { leftContext += this.content }

    let context = leftContext + rightContext

    return context
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

      // STRUCTURE OPERATIONS

      /**
       * NOOP
       *
       * ONE PARAMETER
       * A textual
       */
      (leftDiff, rightDiff = null) => {
        return false
      },

      /**
       * INSERT || DELETE
       *
       * Similar to TEXTINSERT || TEXDELETE, but in this case we need a balanced tree
       */
      (leftDiff, rightDiff = null) => {
        // Only one diff that have at least one tag inside is accepted
        if (rightDiff !== null) return false
        if (!RegExp(regexp.tagSelector).test(leftDiff.content)) return false

        // Get the matching tags
        let matches = []
        let match
        let tagSelectorRegexp = RegExp(regexp.tagSelector, 'g')
        while ((match = tagSelectorRegexp.exec(leftDiff.content)) !== null) {
          matches.push(match[0])
        }

        // if the matches are not balanced
        if (matches.length % 2 !== 0) return false

        // Check if first and last elements are equals
        // The first element can have also
        let firstElementName = matches[0].replace(RegExp(regexp.tagElements, 'g'), '')
        let secondElementName = matches[matches.length - 1].replace(RegExp(regexp.tagElements, 'g'), '')
        if (firstElementName.split(/\s/)[0] !== secondElementName) return false

        // Check type
        let type = leftDiff.op === diffType.mechanical.ins
          ? diffType.structural.insert
          : diffType.structural.delete

        let contentSelectorRegexp = RegExp(`^${regexp.textSelector}<${firstElementName}>.*</${secondElementName}>${regexp.textSelector}$`)

        return contentSelectorRegexp.test(leftDiff.content)
          ? type
          : false
      },

      // TEXTUAL OPERATIONS

      /**
       * PUNCTUATION
       *
       * NOTE: must be two diffs
       * They are changes over the only punctuations without affecting the real text.
       * They can have optionally a follwing space and a letter
       */
      (leftDiff, rightDiff = null) => {
        // Block un coupled diffs
        if (rightDiff === null) return false

        // It must not cointains a tag
        if (RegExp(regexp.tagSelector).test(leftDiff) && RegExp(regexp.tagSelector).test(leftDiff)) return false

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

      /**
       * WORDREPLACE
       *
       * TBD
       */
      (leftDiff, rightDiff = null) => false,

      /**
       * TEXTREPLACE
       *
       * NOTE: only two parameters
       * If the position of two diffs are the same, the content and the operation are different
       */
      (leftDiff, rightDiff = null) => {
        if (rightDiff === null) return false

        return (leftDiff.content !== rightDiff.content &&
        leftDiff.pos === rightDiff.pos &&
        leftDiff.op !== rightDiff.op)
          ? diffType.structural.textReplace
          : false
      },

      /**
       * WORDCHANGE
       *
       * NOTE: can be one or more diffs
       * First the method tries to gather the word in which the diff is contained and tag it as a wordchange
       * If the diffs are two, it takes the context without diffs and check if they're equals. If so, it is a wordchange
       */
      (leftDiff, rightDiff = null) => {
        // Gather the context of the leftDiff
        let leftContext = leftDiff._getWord(this.oldText, this.newText)

        // If leftDiff has a tag inside block
        if (RegExp(regexp.tagSelector).test(leftDiff.content)) return false

        // Two diffs
        if (rightDiff != null) {
          // If rightDiff has a tag inside block
          if (RegExp(regexp.tagSelector).test(rightDiff.content)) return false
          let rightContext = rightDiff._getWord(this.oldText, this.newText)

          return (leftContext !== '' && rightContext !== '') && (RegExp(regexp.wordchange).test(leftContext) && RegExp(regexp.wordchange).test(rightContext) && (leftContext === rightContext))
            ? diffType.structural.wordchange
            : false
        // One single diff
        } else {
          return (leftContext !== '') && RegExp(regexp.wordchange).test(leftContext)
            ? diffType.structural.wordchange
            : false
        }
      },

      /**
       * TEXTINSERT || TEXTDELETE
       *
       * NOTE: only one parameter
       * If the previous rules don't match, this will match
       */
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
          if (this._checkRuleResulCorrectness(ruleResult)) {
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
          if (this._checkRuleResulCorrectness(ruleResult)) {
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

  _checkRuleResulCorrectness (result) {
    // Check if the result is not false
    if (result === false) return false

    // Check if the result is not null
    if (result === null) return false

    // Check if the result is not undefined
    if (typeof result === 'undefined') return false

    // Otherwise return true
    return true
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
