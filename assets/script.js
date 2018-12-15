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

  function makeDiff (oldText, newText, type) {
    const algorithm = new DiffAlgorithmSelector(oldText, newText, type)
    algorithm.runDiffAlgorithm()
    let text = algorithm.getStructuralOperations()
    logOutput(JSON.stringify(text, null, 2))
  }
})

const logOutput = text => {
  codeResult.append(text)
  codeResult.append('\n')
}
