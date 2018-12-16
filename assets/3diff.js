/* eslint-disable no-unused-vars */
/* eslint-disable no-labels */

// List of diff types
const diffType = {
  mechanical: {
    id: 'edit',
    ins: 'INS',
    del: 'DEL'
  },
  structural: {
    id: 'structural',
    punctuation: 'PUNCTUATION'
  },
  semantic: {
    id: 'semantic'
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
  // Punctuation rules
  punctuation: [
    // First rule: if two diffs are without the same operation (INS or DEL) OR a single diff
    (leftDiff, rightDiff = null) => rightDiff === null ? true : (leftDiff.op !== rightDiff.op),

    // Second rule: if the diff position are same
    (leftDiff, rightDiff = null) => rightDiff === null ? true : (leftDiff.pos === rightDiff.pos),

    // Third rule: if the text contains only the matching pattern
    (leftDiff, rightDiff = null) => {
      // If we have only leftDiff
      if (rightDiff === null) { return RegExp(regexp.punctuation).exec(leftDiff.content).index === 0 }

      // If we have both diffs
      let leftRegex = RegExp(regexp.punctuation).exec(leftDiff.content)
      let rightRegex = RegExp(regexp.punctuation).exec(rightDiff.content)
      return ((leftRegex !== null && leftRegex.index === 0) && (rightRegex !== null && rightRegex.index === 0))
    }
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
    let absoluteIndex = 0
    let newDiffs = []

    // Iterate over patches
    for (let patch of this.patches) {
      // Iterate over diffs
      patch['diffs'].map((diff, index) => {
        // Increase the current index by the length of current element, if it wasn't a DEL
        if (index > 0) {
          let previous = patch['diffs'][index - 1]
          if (previous[0] !== -1) {
            absoluteIndex += parseInt(previous[1].length)
          }
        }
        // Not_changed status doesn't matter
        if (diff[0] !== 0) {
          // Get mechanical type
          let op = diff['0'] === 1 ? diffType.mechanical.ins : diffType.mechanical.del

          // Update diffs
          newDiffs.push({
            id: getId(newDiffs.length, diffType.mechanical.id),
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
      // Set leftDiff as not found
      let found = false
      // Get reference to leftIndex
      let leftDiff = newListMechanicalOperations[leftIndex]

      // Remove the current diff from the list
      newListMechanicalOperations.splice(leftIndex, 1)

      // Iterate over the list of all mechanical operations without the other one
      let rightIndex = leftIndex
      for (let rightDiff of newListMechanicalOperations) {
        // Check punctuation
        if (this._checkPuntuation(leftDiff, rightDiff)) {
          // Remove this diff
          newListMechanicalOperations.splice(rightIndex, 1)

          // Update structural operations
          this.listStructuralOperations.push(this._createPunctuation(leftDiff, rightDiff))

          // Diff tagged as found
          found = true
          break
        }
        rightIndex++
      }

      // If The leftDiff is not inserted yet inside the structural
      if (!found) {
        // If no matching patterns
        if (this._checkPuntuation(leftDiff)) {
          return this.listStructuralOperations.push(this._createPunctuation(leftDiff))
        }
      }
    }
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
    // Handle when rightDiff doesn't exist
    let items = [leftDiff]
    if (rightDiff != null) { items.push(rightDiff) }

    // Return the structure
    return {
      id: getId(this.listStructuralOperations.length, diffType.structural.id),
      op: diffType.structural.punctuation,
      by: 'Gianmarco Spinaci',
      timestamp: Date.now(),
      items: items
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

function getId (lastId, type) {
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

/* eslint-enable no-unused-vars */
