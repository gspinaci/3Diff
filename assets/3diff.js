
/* eslint-disable no-unused-vars */

// List of diff types
const diffType = {
  mechanical: {
    ins: 'INS',
    del: 'DEL'
  },
  structural: {
    punctuation: 'PUNCTUATION'
  }
}

// List of algorithms
const algorithms = {
  diffMatchPatch: 'diff_match_patch'
}

const regexp = {
  // Match a punctuation that can have 0 OR 1 space and 0 OR 1 letter
  punctuation: /\W[\s]?[A-z]?/
}

// List of structural rules
const structuralRules = {
  punctuation: [
    // Check if the two diffs are different
    (leftDiff, rightDiff) => leftDiff.op !== rightDiff.op,

    // Check if the text containt a punct in the first element
    (leftDiff, rightDiff) => ((RegExp(regexp.punctuation).exec(leftDiff.content).index === 0) && (RegExp(regexp.punctuation).exec(rightDiff.content))),

    // Check if the two position are equal
    (leftDiff, rightDiff) => leftDiff.pos === rightDiff.pos
  ]
}
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
  /**
   *
   *
   * @param {*} listMechanicalOperations
   * @memberof Adapter
   */
  makeDiff (listMechanicalOperations) {
    this.threeDiff = new ThreeDiff(listMechanicalOperations)
  }

  /**
   *
   *
   * @returns
   * @memberof Adapter
   */
  getStructuralOperations () {
    return this.threeDiff._getStructuralOperations()
  }

  /**
   *
   *
   * @param {Number} length of the
   * @returns {String} formatted eg "edit-0001"
   * @memberof Adapter
   *
   * This method returns the next id
   */
  _getId (lastId) {
    // Update the lastId
    lastId++

    // Start to create the new id
    let id = 'edit-'

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
    super()
    // Create the class

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
    let absoluteIndex = 0
    let newDiffs = []

    // Iterate over patches
    for (let patch of this.patches) {
      // Iterate over diffs
      patch['diffs'].map((diff, index) => {
        // Increase the current index by the length of current element, if it wasn't a DEL
        if (index > 0) {
          let previous = patch['diffs'][index - 1]
          if (previous[0] !== -1) { absoluteIndex += parseInt(previous[1].length) }
        }
        // Not_changed status doesn't matter
        if (diff[0] !== 0) {
        // Get mechanical type
          let op = diff['0'] === 1 ? diffType.mechanical.ins : diffType.mechanical.del

          // Update diffs
          newDiffs.push({
            id: this._getId(newDiffs.length),
            op: op,
            content: diff['1'],
            pos: absoluteIndex
          })
        }
      })
    }
    return newDiffs
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
   * @param {Array} listMechanicalOperations
   * @memberof ThreeDiff
   */
  constructor (listMechanicalOperations) {
    // Save the list of all the mechanical operations
    this.listMechanicalOperations = listMechanicalOperations
    this.listStructuralOperations = []
    this.listSemanticOperations = []

    // Log the mechanical operations
    // logOutput(JSON.stringify(listMechanicalOperations, null, 2))

    // Execute the structural analysis
    this._executeStructuralAnalysis(this.listMechanicalOperations)
  }

  /**
   *
   *
   * @memberof ThreeDiff
   */
  _executeStructuralAnalysis (listMechanicalOperations) {
    // Iterate over the list of mechanical operations
    listMechanicalOperations.map((leftDiff, leftIndex) => {
      // Remove the current diff from the list
      listMechanicalOperations.splice(leftIndex, 1)

      // Iterate over the list of all mechanical operations without the other one
      listMechanicalOperations.map(rightDiff => {
        // Create punctuation if the two diff are
        if (this._checkPuntuation(leftDiff, rightDiff)) { this.listStructuralOperations.push(this._createPunctuation(leftDiff, rightDiff)) }
      })
    })
  }

  /**
   *
   *
   * @param {JSON} leftDiff
   * @param {JSON} rightDiff
   * @returns
   * @memberof ThreeDiff
   */
  _checkPuntuation (leftDiff, rightDiff) {
    let punctuation = true
    structuralRules.punctuation.map(rule => {
      if (!rule(leftDiff, rightDiff)) punctuation = false
    })
    return punctuation
  }

  /**
   *
   *
   * @param {JSON} leftDiff
   * @param {JSON} rightDiff
   * @memberof ThreeDiff
   */
  _createPunctuation (leftDiff, rightDiff) {
    //
    return {
      id: 'structural-0010',
      op: diffType.structural.punctuation,
      old: '',
      new: '',
      by: 'Gianmarco Spinaci',
      timestamp: Date.now(),
      items: [
        leftDiff,
        rightDiff
      ]
    }
  }

  /**
   *
   *
   * @returns
   * @memberof ThreeDiff
   */
  _getStructuralOperations () {
    return this.listStructuralOperations
  }
}

/* eslint-enable no-unused-vars */
