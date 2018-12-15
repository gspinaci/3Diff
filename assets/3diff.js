/**
 *
 *
 */

/* eslint-disable no-unused-vars */

// Constants
const INS = 'INS'
const DEL = 'DEL'
const PUNCTUATION = 'PUNCTUATION'

// List of algorithms
const algorithms = {
  diffMatchPatch: 'diff_match_patch'
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
  constructor () {
    console.log('Adapter created')
  }

  makeDiff (listMechanicalOperations) {
    this.threeDiff = new ThreeDiff(listMechanicalOperations)
  }

  /**
   *
   *
   * @param {Number} length
   * @returns {String} formatted eg "edit-0001"
   * @memberof Adapter
   */
  _getId (length) {
    length++
    let id = 'edit-'
    let tmp = length.toString()
    let max = 4 - tmp.length

    while (max > 0) {
      id += '0'
      max--
    }
    return id + length
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
      patch['diffs'].forEach((diff, index) => {
        // Increase the current index by the length of current element, if it wasn't a DEL
        if (index > 0) {
          let previous = patch['diffs'][index - 1]
          if (previous[0] !== -1) { absoluteIndex += parseInt(previous[1].length) }
        }
        // Not_changed status doesn't matter
        if (diff[0] !== 0) {
        // Get mechanical type
          let op = diff['0'] === 1 ? INS : DEL

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
    logOutput(JSON.stringify(listMechanicalOperations, null, 2))
  }
}
