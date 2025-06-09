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
		i.onloadend = function (t) {
			t.target.readyState === FileReader.DONE &&
				n({
					file: e,
					data: new Uint8Array(t.target.result),
				})
		}
		i.readAsArrayBuffer(e)
	})
}
function setKeyMedias(e) {
	keyMedias = e
	var n = document.getElementById('pkKeyMediaSelect')
	for (let t = n.options.length - 1; t >= 0; t--) n.options[t] = null
	for (let t = 0; t < keyMedias.length; t++) {
		var i = document.createElement('option')
		i.appendChild(document.createTextNode(keyMedias[t].visibleName))
		i.value = keyMedias[t].visibleName
		n.appendChild(i)
	}
}
function getSelectedKeyMedia() {
	const e = document.getElementById('pkKeyMediaSelect').value
	return keyMedias.find(km => km.visibleName === e) || null
}
function setKSPs() {
	var e = document.getElementById('pkKSPSelect')
	for (let n = e.options.length - 1; n >= 0; n--) e.options[n] = null
	for (let n = 0; n < euSettings.KSPs.length; n++) {
		var t = document.createElement('option')
		t.appendChild(document.createTextNode(euSettings.KSPs[n].name))
		t.value = euSettings.KSPs[n].name
		e.appendChild(t)
	}
}
function getSelectedKSP() {
	const e = document.getElementById('pkKSPSelect').value
	return euSettings.KSPs.find(ksp => ksp.name === e) || null
}
function onConfirmKSPOperation(e) {
	var n = '<a href="' + e.url + '">'
	n +=
		'<img src="data:image/bmp;base64,' +
		e.qrCode +
		'" style="padding: 10px; background: white;">'
	n += '</a>'
	document.getElementById('pkKSPQRImageBlock').innerHTML = n
	document.getElementById('pkKSPQRBlock').style.display = 'block'
}
function setLibraryType(e) {
	var n = document.getElementById('pkFileBlock'),
		t = document.getElementById('pkKeyMediaBlock'),
		i = document.getElementById('pkKSPBlock'),
		a = document.getElementById('signBlock'),
		o = document.getElementById('dataFile')

	n.style.display = 'none'
	t.style.display = 'none'
	i.style.display = 'none'
	a.style.display = 'none'
	o.style.display = 'block'
	formType = e

	switch (e) {
		case PK_FORM_TYPE_FILE:
			n.style.display = 'block'
			euSign = euSignFile
			break
		case PK_FORM_TYPE_KM:
			t.style.display = 'block'
			euSign = euSignKeyMedia
			break
		case PK_FORM_TYPE_KSP:
			i.style.display = 'block'
			euSign = euSignFile
	}
	initialize()
		.then(() => (euSign === euSignFile ? [] : euSign.GetKeyMedias()))
		.then(e => {
			setKeyMedias(e)
			a.style.display = 'block'
		})
		.catch(e => {
			console.log('Initialize error: ' + (e.message || e))
		})
}
function initialize() {
	return new Promise(function (resolve, reject) {
		var initialized = false
		if (euSign === euSignFile) {
			euSign
				.IsInitialized()
				.then(function (res) {
					if (!(initialized = res)) {
						return euSign.Initialize(euSettings)
					}
				})
				.then(function () {
					if (!initialized) {
						setKSPs()
						euSign.AddEventListener(
							EndUserConstants.EndUserEventType.ConfirmKSPOperation,
							onConfirmKSPOperation
						)
					}
					resolve()
				})
				.catch(reject)
		} else {
			euSign
				.GetLibraryInfo()
				.then(function (info) {
					if (!info.supported) throw 'Бібліотека не підтримується'
					if (!info.loaded) throw 'Бібліотека не завантажена'
					return euSign.IsInitialized()
				})
				.then(function (res) {
					if (!(initialized = res)) return euSign.Initialize(euSettings)
				})
				.then(() => resolve())
				.catch(reject)
		}
	})
}
window.onload = function () {
	try {
		document.getElementById('spinner').style.display = 'none'
		document.getElementById('sign-button').disabled = false

		document.getElementById('pkFile').addEventListener('click', () => {
			document.getElementById('pkFilePassword').value = ''
		})
		document.getElementById('pkFile').addEventListener('change', () => {
			document.getElementById('pkFilePassword').value = ''
		})
		document.getElementById('pkTypeFile').addEventListener('click', () => {
			setLibraryType(PK_FORM_TYPE_FILE)
		})
		document.getElementById('pkTypeKeyMedia').addEventListener('click', () => {
			setLibraryType(PK_FORM_TYPE_KM)
		})
		document.getElementById('pkTypeKSP').addEventListener('click', () => {
			setLibraryType(PK_FORM_TYPE_KSP)
		})
		document.getElementById('pkKSPSelect').addEventListener('change', () => {
			const selected = getSelectedKSP()
			document.getElementById('pkKSPUserIdBlock').style.display =
				selected && selected.confirmationURL ? 'none' : 'block'
		})
		document.getElementById('sign-button').addEventListener('click', () => {
			console.log('Sign button clicked')
		})
		setLibraryType(PK_FORM_TYPE_FILE)
	} catch (e) {
		console.error(e)
	}
}
