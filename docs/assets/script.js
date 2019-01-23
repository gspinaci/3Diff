/**
 *
 */

// Init vars

const codeMechanicalList = $('#codeMechanicalList')
const codeStructuralList = $('#codeStructuralList')
const txtDiffHTML = $('#txtDiffHTML')
const btnDiff = $('#btnDiff')

$('document').ready(function () {
  btnDiff.on('click', function () {
    let oldText = $('#oldTextTextarea').val()
    let newText = $('#newTextTextarea').val()

    makeDiff(oldText, newText, algorithms.diffMatchPatch)
  })

  function makeDiff (oldText, newText, type) {
    // Get the right algorithm
    const algorithm = new DiffAlgorithmSelector(oldText, newText, type)

    // Log the result
    logDiffHTML(algorithm.getDiffHTML())
    logMechanicalList(JSON.stringify(algorithm.getMechanicalOperations(), null, 2))
    logStructuralList(JSON.stringify(algorithm.getStructuralOperations(), null, 2))
  }
})

/**
 *
 *
 * @param {*} text
 */
const logMechanicalList = text => codeMechanicalList.text(text)

/**
 *
 *
 * @param {*} text
 */
const logStructuralList = text => codeStructuralList.text(text)

/**
 *
 *
 * @param {*} html
 */
const logDiffHTML = html => txtDiffHTML.html(html)
