/**
 *
 */

// Init vars

const codeResult = $('#codeResult')
const btnDiff = $('#btnDiff')

$('document').ready(function () {
  btnDiff.on('click', function () {
    let oldText = $('#oldTextTextarea').val()
    let newText = $('#newTextTextarea').val()

    makeDiff(oldText, newText, algorithms.diffMatchPatch)
  })

  function makeDiff (oldText, newText, type = 'diff_match_patch') {
    const algorithm = new DiffAlgorithmSelector(oldText, newText, type)
    algorithm.runDiffAlgorithm()
  }
})

const logOutput = text => {
  codeResult.append(text)
  codeResult.append('\n')
}
