/**
 *
 */

// Init vars

const codeMechanicalList = $('#codeMechanicalList')
const codeStructuralList = $('#codeStructuralList')
const oldTextTextarea = $('#oldTextTextarea')
const newTextTextarea = $('#newTextTextarea')
const txtDiffHTML = $('#txtDiffHTML')
const btnDiffTextarea = $('#btnDiffTextarea')

const oldT = `<div class="mw-parser-output">
    <table class="infobox vevent" style="width:22em">
        <caption class="summary">AlternC</caption>
        <tbody>
            <tr>
                <td colspan="2" style="text-align:center">
                    <a href="/wiki/File:Logo_AlternC.png" class="image" title="AlternC logo">
                        <img alt="AlternC logo" src="//upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Logo_AlternC.png/125px-Logo_AlternC.png"
                            width="125" height="85" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Logo_AlternC.png/188px-Logo_AlternC.png 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Logo_AlternC.png/250px-Logo_AlternC.png 2x"
                            data-file-width="1824" data-file-height="1236" />
                    </a>
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Software_developer" title="Software developer">Developer(s)</a>
                </th>
                <td>
                    <a rel="nofollow" class="external text" href="http://www.alternc.com/L-equipe-d-AlternC">Misc
                        Contributors</a>
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">Initial release</th>
                <td>November&#160;2000
                    <span style="display:none">&#160;(<span class="bday dtstart published updated">2000-11</span>)</span>
                </td>
            </tr>
            <tr style="display: none;">
                <td colspan="2" style="text-align:center"></td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Software_release_life_cycle" title="Software release life cycle">Stable release</a>
                </th>
                <td>
                    <div style="margin:0px;">
                        3.0
                        <sup id="cite_ref-1" class="reference">
                            <a href="#cite_note-1">&#91;1&#93;</a>
                        </sup>
                        / February&#160;8,&#160;2013<span style="display:none">&#160;(<span class="bday dtstart published updated">2013-02-08</span>)</span>
                    </div>
                </td>
            </tr>
            <tr style="display:none">
                <td colspan="2"></td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Operating_system" title="Operating system">Operating system</a>
                </th>
                <td>
                    <a href="/wiki/UNIX-like" class="mw-redirect" title="UNIX-like">UNIX-like</a>
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Software_categories#Categorization_approaches" title="Software categories">Type</a>
                </th>
                <td>
                    <a href="/wiki/Web_Hosting" class="mw-redirect" title="Web Hosting">Web Hosting</a> Server
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Software_license" title="Software license">License</a>
                </th>
                <td>
                    <a href="/wiki/GNU_General_Public_License" title="GNU General Public License">GPLv2</a>
                    <sup id="cite_ref-2" class="reference">
                        <a href="#cite_note-2">&#91;2&#93;</a>
                    </sup>
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">Website</th>
                <td>
                    <a rel="nofollow" class="external text" href="http://www.alternc.com/">www.alternc.com</a>
                </td>
            </tr>
        </tbody>
    </table>
</div>`

const newT = `<div class="mw-parser-output">
    <table class="infobox vevent" style="width:22em">
        <caption class="summary">AlternC</caption>
        <tbody>
            <tr>
                <td colspan="2" style="text-align:center">
                    <a href="/wiki/File:Logo_AlternC.svg" class="image">
                        <img alt="Logo AlternC.svg" src="//upload.wikimedia.org/wikipedia/commons/thumb/d/db/Logo_AlternC.svg/220px-Logo_AlternC.svg.png"
                            decoding="async" width="220" height="149" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/d/db/Logo_AlternC.svg/330px-Logo_AlternC.svg.png 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/d/db/Logo_AlternC.svg/440px-Logo_AlternC.svg.png 2x"
                            data-file-width="1824" data-file-height="1236">
                    </a>
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Software_developer" title="Software developer">Developer(s)</a>
                </th>
                <td>
                    <a rel="nofollow" class="external text" href="http://www.alternc.com/L-equipe-d-AlternC">Misc
                        Contributors</a>
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">Initial release</th>
                <td>November&nbsp;2000<span class="noprint">; 18&nbsp;years ago</span><span style="display:none">&nbsp;(<span
                            class="bday dtstart published updated">2000-11</span>)</span></td>
            </tr>
            <tr style="display: none;">
                <td colspan="2" style="text-align:center"></td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Software_release_life_cycle" title="Software release life cycle">Stable release</a>
                </th>
                <td>
                    <div style="margin:0px;">
                        3.0
                        <sup id="cite_ref-1" class="reference">
                            <a href="#cite_note-1">[1]</a>
                        </sup>
                        / February&nbsp;8,&nbsp;2013<span style="display:none">&nbsp;(<span class="bday dtstart published updated">2013-02-08</span>)</span>
                    </div>
                </td>
            </tr>
            <tr style="display:none">
                <td colspan="2"></td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Operating_system" title="Operating system">Operating system</a>
                </th>
                <td>
                    <a href="/wiki/UNIX-like" class="mw-redirect" title="UNIX-like">UNIX-like</a>
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Software_categories#Categorization_approaches" title="Software categories">Type</a>
                </th>
                <td>
                    <a href="/wiki/Web_Hosting" class="mw-redirect" title="Web Hosting">Web Hosting</a> Server
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">
                    <a href="/wiki/Software_license" title="Software license">License</a>
                </th>
                <td>
                    <a href="/wiki/GNU_General_Public_License" title="GNU General Public License">GPLv2</a>
                    <sup id="cite_ref-2" class="reference">
                        <a href="#cite_note-2">[2]</a>
                    </sup>
                </td>
            </tr>
            <tr>
                <th scope="row" style="white-space: nowrap;">Website</th>
                <td>
                    <span class="url"><a rel="nofollow" class="external text" href="http://www.alternc.com">www<wbr>.alternc<wbr>.com</a></span>
                </td>
            </tr>
        </tbody>
    </table>
</div>`

$('document').ready(function () {
  oldTextTextarea.val(oldT)
  newTextTextarea.val(newT)

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
