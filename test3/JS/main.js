let signError = ''
let isDocumentSignedSuccess = false
const PK_FORM_TYPE_FILE = 1,
	PK_FORM_TYPE_KM = 2,
	PK_FORM_TYPE_KSP = 3
var euSettings = {
	language: 'uk',
	encoding: 'utf-8',
	httpProxyServiceURL: 'https://sign-wiget-node-js-server.onrender.com',
	directAccess: !0,
	CAs: './Data/CAs.json',
	CACertificates: './Data/CACertificates.p7b',
	allowedKeyMediaTypes: [],
	KSPs: [],
}
var euSignFile = new EndUser(null, EndUserConstants.EndUserLibraryType.JS),
	euSignKeyMedia = new EndUser(null, EndUserConstants.EndUserLibraryType.SW),
	keyMedias = [],
	euSign = euSignFile,
	formType = PK_FORM_TYPE_FILE
function readFile(e) {
	return new Promise(function (n, t) {
		var i = new FileReader()
		;(i.onloadend = function (t) {
			t.target.readyState === FileReader.DONE &&
				n({
					file: e,
					data: new Uint8Array(t.target.result),
				})
		}),
			i.readAsArrayBuffer(e)
	})
}
function signData() {
	const enveloped = document.getElementById('envelopedOrigin').checked
	const fileInput = document.getElementById('dataFile')
	const signButton = document.getElementById('sign-button')
	const spinner = document.getElementById('spinner')

	spinner.style.display = 'block'
	signButton.disabled = true

	readFile(fileInput.files[0])
		.then(({ data }) => _signData(data, enveloped))
		.catch(err => {
			spinner.style.display = 'none'
			signButton.disabled = false
			console.error('Не вдалося зчитати файл:', err)
		})
}
function _signData(fileBytes, includeOriginal) {
	var signButton = document.getElementById('sign-button'),
		spinner = document.getElementById('spinner')

	readPrivateKey()
		.then(function (keyInfo) {
			console.log('EndUser: ключ зчитано:', keyInfo.subjCN)

			return euSign.GetOwnCertificates().then(certificates => {
				const cert = certificates.find(
					cert => cert?.infoEx?.serial === keyInfo.serial
				)
				const certData = cert
					? { infoEx: cert.infoEx, data: arrayBufferToBase64(cert.data) }
					: keyInfo

				pkDetails.innerHTML = JSON.stringify(certData, null, 4).replaceAll(
					'\n',
					'<br>'
				)

				if (formType === PK_FORM_TYPE_KSP) {
					document.getElementById('pkKSPQRImageLabel').innerText =
						'Відскануйте QR-код для підпису в моб. додатку:'
				}

				return euSign.SignDataEx(1, fileBytes, true, true, includeOriginal)
			})
		})
		.then(function (signedData) {
			console.log('Дані підписано успішно')
			document.getElementById('sign-textarea').value = signedData

			if (formType === PK_FORM_TYPE_KSP) {
				document.getElementById('pkKSPQRBlock').style.display = 'none'
			}

			spinner.style.display = 'none'
			signButton.disabled = false
			isDocumentSignedSuccess = true

			saveSignData(signedData)
		})
		.catch(function (error) {
			if (formType === PK_FORM_TYPE_KSP) {
				document.getElementById('pkKSPQRBlock').style.display = 'none'
			}

			spinner.style.display = 'none'
			signButton.disabled = false

			const msg = error.message || error
			console.error('Помилка підпису:', msg)
			signError = msg
			sendErrorMsg()
			isDocumentSignedSuccess = false
		})
}
