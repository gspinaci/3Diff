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
    move: 'MOVE',
    noop: 'NOOP',
    wrap: 'WRAP',
    unwrap: 'UNWRAP',
    split: 'SPLIT',
    join: 'JOIN'
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

  // unclosed
  unclosedTagSelector: '<[.A-z]?[^(><.)]+',
  unopenedTagSelector: '[.A-z]?[^(><.)]+>',

  // Text selector
  textSelector: '[A-z\\s]*',

  lowercaseLetter: '[a-z]+',

  tagElements: '[<>/?]',

  splitJoin: '^[\\s]*<[.A-z]?[^(><.)]+><[.A-z]?[^(><.)]+>[\\s]*$'
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

  getText (oldText, newText) {
    return newText
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
   * @param {*} text
   * @returns context
   * @memberof Diff
   *
   *     = - = = = +
   * eg: w o r l d s
   *     0 1 2 3 4 5
   */
  getWord (text) {
    // Get left and right context
    let leftContext = text.substring(0, this.pos)
    let rightContext = text.substring(this.op === diffType.mechanical.ins ? this.pos + this.content.length : this.pos, text.length)

    // Get only the current word
    leftContext = leftContext.split(/\s/)[leftContext.split(/\s/).length - 1]
    rightContext = rightContext.split(/\s/)[0]

    if (this.op === diffType.mechanical.ins) { leftContext += this.content }

    let context = leftContext + rightContext

    return context
  }

  /**
   *
   *
   * @param {*} text
   * @memberof MechanicalDiff
   */
  getTag (newText, oldText) {
    let newTextSplitted = newText.split(this.content)
    let oldTextSplitted = oldText.split(this.content)

    let returnElement = { diff: this }
    if (newTextSplitted.length > 1) {
      returnElement.left = newTextSplitted[0]
      returnElement.right = newTextSplitted[1]
    } else {
      returnElement.left = oldTextSplitted[0]
      returnElement.right = oldTextSplitted[1]
    }

    console.log(RegExp(regexp.unclosedTagSelector, 'g').exec(returnElement.left))

    // returnElement.left = returnElement.left.split(RegExp(regexp.unclosedTagSelector, 'g'))[0]
    // returnElement.right = returnElement.right.split(RegExp(regexp.unopenedTagSelector, 'g'))[0]

    return returnElement
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

      // OPERATIONS OVER STRUCTURE

      /**
       * MOVE
       *
       * Two params
       * Is a MOVE if and only if the DEL and INS contents are equal and the pos different
       */
      (leftDiff, rightDiff = null) => {
        // Block single diff
        if (rightDiff === null) { return false }

        return rightDiff.content.trim() === leftDiff.content.trim() &&
        rightDiff.pos !== leftDiff.pos &&
        leftDiff.op !== rightDiff.op
          ? diffType.structural.move
          : false
      },

      /**
       * WRAP / UNWRAP
       */
      (leftDiff, rightDiff = null) => {
        if (rightDiff === null) { return false }

        // If the two diffs are not tags block
        if ((!RegExp(regexp.tagSelector).test(leftDiff.content) && !RegExp(regexp.tagSelector).test(rightDiff.content)) && (leftDiff.op === rightDiff.op)) { return false }

        // If the two tags are equal
        let leftDiffTagName = leftDiff.content.replace(RegExp(regexp.tagElements, 'g'), '')
        let rightDiffTagName = rightDiff.content.replace(RegExp(regexp.tagElements, 'g'), '')
        if (leftDiffTagName !== rightDiffTagName) return false

        // Get the text: if it's a wrap (two ins), the text is new. or viceversa
        let text = leftDiff.op === diffType.mechanical.ins ? this.newText : this.oldText

        // TODO check if balanced

        // Get indexes
        let minIndex = Math.min(leftDiff.pos + leftDiff.content.length, rightDiff.pos + rightDiff.content.length)
        let maxIndex = Math.max(leftDiff.pos, rightDiff.pos)
        let wrapContent = text.substring(minIndex, maxIndex)

        return leftDiff.op === diffType.mechanical.ins ? diffType.structural.wrap : diffType.structural.unwrap
      },

      /**
       * JOIN/SPLIT
       */
      (leftDiff, rightDiff = null) => {
        // Must be only a diff
        if (rightDiff !== null) { return false }

        // Must be in this way <tag></tag> or </tag><tag> with optional space
        if (!RegExp(regexp.splitJoin).test(leftDiff.content)) { return false }

        // TODO check balance
        let matches = []
        let match
        let tagSelectorRegexp = RegExp(regexp.tagSelector, 'g')
        while ((match = tagSelectorRegexp.exec(leftDiff.content)) !== null) {
          matches.push(match[0])
        }

        return leftDiff.op === diffType.mechanical.ins ? diffType.structural.split : diffType.structural.join
      },

      /**
       * NOOP
       *
       * ONE PARAMETER
       * A textual
       */
      (leftDiff, rightDiff = null) => {
        // Block single diff
        if (rightDiff === null) { return false }

        // Get a JSON object with contexts
        let leftDiffContext = leftDiff.getTag(this.newText, this.oldText)
        let rightDiffContext = rightDiff.getTag(this.newText, this.oldText)

        // Concatenate context strings
        let leftDiffString = leftDiffContext.left + leftDiffContext.diff.content + rightDiffContext.right
        let rightDiffString = rightDiffContext.left + rightDiffContext.diff.content + rightDiffContext.right

        // If the contexts contains a tag is a NOOP
        if (RegExp(regexp.tagSelector).test(leftDiffString) && RegExp(regexp.tagSelector).test(rightDiffString)) {
          if (leftDiffContext.left === rightDiffContext.left && leftDiffContext.right === rightDiffContext.right) {
            return diffType.structural.noop
          } else {
            return false
          }
        } else { return false }
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

      // OPERATIONS OVER TEXT

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
        let leftContext = leftDiff.getWord(this.newText)

        // If leftDiff has a tag inside block
        if (RegExp(regexp.tagSelector).test(leftDiff.content)) return false

        // Two diffs
        if (rightDiff != null) {
          // If rightDiff has a tag inside block
          if (RegExp(regexp.tagSelector).test(rightDiff.content)) return false
          let rightContext = rightDiff.getWord(this.newText)

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

    this._setOldsNews()
  }

  /**
   *
   *
   * @memberof ThreeDiff
   */
  _setOldsNews () {
    for (let structuralOperation of this.listStructuralOperations) {
      // Create a reference to the items
      let items = structuralOperation.items

      // Get first and last diff
      let newTextBoundaries = this._getContextBoundariesNew(this.newText, items[0], items[items.length - 1])

      // Create the new text
      let newText = newTextBoundaries.leftContext
      items.map((diff, index) => {
        // Save reference to the next diff
        let nextDiff = items[index + 1]

        // If is an insert save it
        if (diff.op === diffType.mechanical.ins) {
          newText += diff.content

          if (typeof nextDiff !== 'undefined') {
            newText += this.newText.substring(diff.pos + diff.content.length, nextDiff.pos)
          }
          // Else don't save it
        } else {
          if (typeof nextDiff !== 'undefined') {
            newText += this.newText.substring(diff.pos, nextDiff.pos)
          }
        }
      })

      newText += newTextBoundaries.rightContext

      // OldText
      let oldTextBoundaries = this._getContextBoundariesOld(this.oldText, items[0], items[items.length - 1])

      let oldText = oldTextBoundaries.leftContext
      items.map((diff, index) => {
        // Save reference to the next diff
        let nextDiff = items[index + 1]

        // If is an insert don't save
        if (diff.op === diffType.mechanical.ins) {
          if (typeof nextDiff !== 'undefined') {
            oldText += this.oldText.substring(diff.pos, nextDiff.pos - diff.content.length)
          }
          // Else don't save it
        } else {
          oldText += diff.content
          if (typeof nextDiff !== 'undefined') {
            oldText += this.oldText.substring(diff.pos + diff.content.length, nextDiff.pos + diff.content.length)
          }
        }
      })

      oldText += newTextBoundaries.rightContext

      // Save the text
      structuralOperation.new = newText
      structuralOperation.old = oldText
    }
  }

  /**
   *
   *
   * @param {*} text
   * @param {*} minDiff
   * @param {*} maxDiff
   * @returns
   * @memberof ThreeDiff
   */
  _getContextBoundariesNew (text, minDiff, maxDiff) {
    // The fixed length that will be used for retrieve the smallest amount of context
    const fixedLength = 10

    const initPos = minDiff.pos
    const endPos = maxDiff.pos + (maxDiff.op === diffType.mechanical.ins ? maxDiff.content.length : 0)

    const minPos = initPos < fixedLength ? 0 : fixedLength
    const maxPos = endPos + fixedLength < text.length ? endPos + fixedLength : text.length

    let leftContext = text.substring(minPos, initPos).split(/\s/)
    let rightContext = text.substring(endPos, maxPos).split(/\s/)

    return {
      leftContext: leftContext[leftContext.length - 1],
      rightContext: rightContext[0]
    }
  }

  /**
   *
   *
   * @param {*} text
   * @param {*} minDiff
   * @param {*} maxDiff
   * @returns
   * @memberof ThreeDiff
   */
  _getContextBoundariesOld (text, minDiff, maxDiff) {
    // The fixed length that will be used for retrieve the smallest amount of context
    const fixedLength = 10

    const initPos = minDiff.pos
    const endPos = maxDiff.pos + (maxDiff.op === diffType.mechanical.del ? maxDiff.content.length : 0)

    const minPos = initPos < fixedLength ? 0 : fixedLength
    const maxPos = endPos + fixedLength < text.length ? endPos + fixedLength : text.length

    let leftContext = text.substring(minPos, initPos).split(/\s/)
    let rightContext = text.substring(endPos, maxPos).split(/\s/)

    return {
      leftContext: leftContext[leftContext.length - 1],
      rightContext: rightContext[0]
    }
  }

  /**
   *
   *
   * @param {*} result
   * @returns
   * @memberof ThreeDiff
   */
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
