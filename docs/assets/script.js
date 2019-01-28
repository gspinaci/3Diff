/**
 *
 */

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.')
}

// Init vars

const codeMechanicalList = $('#codeMechanicalList')
const codeStructuralList = $('#codeStructuralList')
const oldTextTextarea = $('#oldTextTextarea')
const newTextTextarea = $('#newTextTextarea')
const txtDiffHTML = $('#txtDiffHTML')

const btnDiffTextarea = $('#btnDiffTextarea')
const btnDiffFile = $('#btnDiffFile')

const oldFile = $('#oldFile')
const newFile = $('#newFile')

const formFile = $('#formFile')
const formTextarea = $('#formTextarea')

const btnShowFormFile = $('#btnShowFormFile')
const btnShowFormTextarea = $('#btnShowFormTextarea')

let oldText = ''
let newText = ''

$('document').ready(function () {
  /**
   *
   */
  btnShowFormFile.on('click', function () {
    showFormFile()
  })

  /**
   *
   */
  btnShowFormTextarea.on('click', function () {
    showFormTextarea()
  })

  oldFile.on('change', function (e) {
    handleFileSelect(e)
  })

  newFile.on('change', function (e) {
    handleFileSelect(e)
  })

  // Call click event
  btnShowFormFile.click()

  // Button textarea
  btnDiffTextarea.on('click', function () {
    if (oldTextTextarea.val().trim().length === 0 || newTextTextarea.val().trim().length === 0) {
      return alert('ERROR!, Fill both textareas')
    }
    makeDiff(oldTextTextarea.val(), newTextTextarea.val(), algorithms.diffMatchPatch)
  })

  btnDiffFile.on('click', function () {
    if (oldText.trim().length === 0 || newText.trim().length === 0) {
      return alert('ERROR!, Upload both files')
    }
    makeDiff(oldText, newText, algorithms.diffMatchPatch)
  })
})

const makeDiff = (oldText, newText, type) => {
  // Get the right algorithm
  const algorithm = new DiffAlgorithmSelector(oldText, newText, type)

  // Log the result
  logDiffHTML(algorithm.getDiffHTML())
  // logMechanicalList(JSON.stringify(algorithm.getMechanicalOperations(), null, 2))
  legSemanticList(JSON.stringify(algorithm.getSemanticOperations(), null, 2))
}

const showFormFile = () => {
  btnShowFormFile.addClass('active')
  btnShowFormTextarea.removeClass('active')
  formTextarea.hide()
  formFile.show()
}

const showFormTextarea = () => {
  btnShowFormTextarea.addClass('active')
  btnShowFormFile.removeClass('active')
  formFile.hide()
  formTextarea.show()
}

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
 * @param {*} text
 */
const legSemanticList = text => codeStructuralList.text(text)

/**
 *
 *
 * @param {*} html
 */
const logDiffHTML = html => txtDiffHTML.html(html)

function handleFileSelect (e) {
  let id = e.target.id
  var file = e.target.files[0]

  if (id === 'oldFile') {
    let reader = new FileReader()

    // Read file into memory as UTF-16
    reader.readAsText(file, 'UTF-8')

    reader.onload = function (e) {
      oldText = e.target.result
    }
  }

  if (id === 'newFile') {
    let reader = new FileReader()

    // Read file into memory as UTF-16
    reader.readAsText(file, 'UTF-8')

    reader.onload = function (e) {
      newText = e.target.result
    }
  }
}
