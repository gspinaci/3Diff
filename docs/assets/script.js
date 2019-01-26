/**
 *
 */

// Init vars

const codeMechanicalList = $('#codeMechanicalList')
const codeStructuralList = $('#codeStructuralList')
const oldTextTextarea = $('#oldTextTextarea')
const newTextTextarea = $('#newTextTextarea')
const txtDiffHTML = $('#txtDiffHTML')
const btnDiffAjax = $('#btnDiffAjax')
const btnDiffTextarea = $('#btnDiffTextarea')

$('document').ready(function () {
  // Button ajax
  btnDiffAjax.on('click', function () {
    // Set requests
    const oldTextRequest = {
      url: 'https://raw.githubusercontent.com/gspinaci/3Diff/master/docs/assets/corpora/alternC/v0.html'
    }

    const newTextRequest = {
      url: 'https://raw.githubusercontent.com/gspinaci/3Diff/master/docs/assets/corpora/alternC/v1.html'
    }

    $.ajax(oldTextRequest).done(oldText => {
      // Update text
      oldTextTextarea.val(oldText)

      $.ajax(newTextRequest).done(newText => {
        // Update text
        newTextTextarea.val(newText)

        // Call diff
        makeDiff(oldText, newText, algorithms.diffMatchPatch)
      })
    })
  })

  // Button textarea
  btnDiffTextarea.on('click', function () {
    makeDiff(oldTextTextarea.val(), newTextTextarea.val(), algorithms.diffMatchPatch)
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
