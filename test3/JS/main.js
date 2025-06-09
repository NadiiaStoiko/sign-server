let signError = ''
let isDocumentSignedSuccess = false
const PK_FORM_TYPE_FILE = 1,
	PK_FORM_TYPE_KM = 2,
	PK_FORM_TYPE_KSP = 3
var euSettings = {
	language: 'uk',
	encoding: 'utf-8',
	httpProxyServiceURL: 'https://sign-server-bnx8.onrender.com',
	directAccess: !0,
	CAs: './Data/CAs.json',
	CACertificates: './Data/CACertificates.p7b',
	allowedKeyMediaTypes: [],
	KSPs: [],
}
// console.log(euSettings)
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
function setKeyMedias(e) {
	keyMedias = e
	var n = document.getElementById('pkKeyMediaSelect')
	for (t = n.options.length - 1; t >= 0; t--) n.options[t] = null
	for (var t = 0; t < keyMedias.length; t++) {
		var i = document.createElement('option')
		i.appendChild(document.createTextNode(keyMedias[t].visibleName)),
			(i.value = keyMedias[t].visibleName),
			n.appendChild(i)
	}
}
function getSelectedKeyMedia() {
	for (
		var e = document.getElementById('pkKeyMediaSelect').value, n = 0;
		n < keyMedias.length;
		n++
	)
		if (keyMedias[n].visibleName === e) return keyMedias[n]
	return null
}
function setKSPs() {
	var e = document.getElementById('pkKSPSelect')
	for (n = e.options.length - 1; n >= 0; n--) e.options[n] = null
	for (var n = 0; n < euSettings.KSPs.length; n++) {
		var t = document.createElement('option')
		t.appendChild(document.createTextNode(euSettings.KSPs[n].name)),
			(t.value = euSettings.KSPs[n].name),
			e.appendChild(t)
	}
}
function getSelectedKSP() {
	for (
		var e = document.getElementById('pkKSPSelect').value, n = 0;
		n < euSettings.KSPs.length;
		n++
	)
		if (euSettings.KSPs[n].name == e) return euSettings.KSPs[n]
	return null
}
function onConfirmKSPOperation(e) {
	var n = ''
	;(n += '<a href="' + e.url + '">'),
		(n +=
			'<img src="data:image/bmp;base64,' +
			e.qrCode +
			'" style="padding: 10px; background: white;">'),
		(n += '</a>'),
		(document.getElementById('pkKSPQRImageBlock').innerHTML = n),
		(document.getElementById('pkKSPQRBlock').style.display = 'block')
}
function setLibraryType(e) {
	var n = document.getElementById('pkFileBlock'),
		t = document.getElementById('pkKeyMediaBlock'),
		i = document.getElementById('pkKSPBlock'),
		a = document.getElementById('signBlock'),
		// l = document.getElementById('dataText'),
		l = '',
		o = document.getElementById('dataFile')
	switch (
		// (l.style.display = 'block'),
		((o.style.display = 'block'),
		(n.style.display = 'none'),
		(t.style.display = 'none'),
		(i.style.display = 'none'),
		(a.style.display = 'none'),
		(formType = e),
		e)
	) {
		case PK_FORM_TYPE_FILE:
			;(n.style.display = 'block'), (euSign = euSignFile)
			break
		case PK_FORM_TYPE_KM:
			;(t.style.display = 'block'), (euSign = euSignKeyMedia)
			break
		case PK_FORM_TYPE_KSP:
			;(i.style.display = 'block'), (euSign = euSignFile)
	}
	initialize()
		.then(function () {
			return euSign == euSignFile ? [] : euSign.GetKeyMedias()
		})
		.then(function (e) {
			setKeyMedias(e), (a.style.display = 'block')
		})
		.catch(function (e) {
			var n = e.message || e
			console.log('Initialize error: ' + n)
			console.log(
				'Виникла помилка при ініціалізації бібліотеки. Опис помилки: ' + n
			)
		})
}
function initialize() {
	return new Promise(function (e, n) {
		var t = !1
		euSign == euSignFile
			? euSign
					.IsInitialized()
					.then(function (e) {
						if (!(t = e))
							return (
								console.log('EndUser: JS library initializing...'),
								euSign.Initialize(euSettings)
							)
						console.log('EndUser: JS library already initialized')
					})
					.then(function () {
						if (!t)
							return (
								console.log('EndUser: JS library initialized'),
								setKSPs(),
								console.log('EndUser: event listener for KSPs registering...'),
								euSign.AddEventListener(
									EndUserConstants.EndUserEventType.ConfirmKSPOperation,
									onConfirmKSPOperation
								)
							)
					})
					.then(function () {
						t || console.log('EndUser: event listener for KSPs registered'),
							(t = !0),
							e()
					})
					.catch(function (e) {
						n(e)
					})
			: euSign
					.GetLibraryInfo()
					.then(function (e) {
						if (!e.supported)
							throw 'Бібліотека web-підпису не підтримується в вашому браузері або ОС'
						if (!e.loaded) {
							if (e.isNativeLibraryNeedUpdate)
								throw (
									'Бібліотека web-підпису потребує оновлення. Будь ласка, встановіть оновлення за посиланням ' +
									e.nativeLibraryInstallURL
								)
							if (e.isWebExtensionSupported && !e.isWebExtensionInstalled)
								throw (
									'Бібліотека web-підпису потребує встановлення web-розширення. Будь ласка, встановіть web-розширення за посиланням ' +
									e.webExtensionInstallURL +
									' та оновіть сторінку'
								)
							throw (
								'Бібліотека web-підпису потребує встановлення. Будь ласка, встановіть бібліотеку за посиланням ' +
								e.nativeLibraryInstallURL +
								' та оновіть сторінку'
							)
						}
						return euSign.IsInitialized()
					})
					.then(function (e) {
						if (!(t = e))
							return (
								console.log('EndUser: SW library initializing...'),
								euSign.Initialize(euSettings)
							)
						console.log('EndUser: SW library already initialized')
					})
					.then(function () {
						t || console.log('EndUser: SW library initialized'), e()
					})
					.catch(function (e) {
						n(e)
					})
	})
}
function readPrivateKey() {
	var e =
			formType == PK_FORM_TYPE_FILE ? document.getElementById('pkFile') : null,
		n =
			formType != PK_FORM_TYPE_KSP
				? document.getElementById(
						formType == PK_FORM_TYPE_FILE
							? 'pkFilePassword'
							: 'pkKeyMediaPassword'
				  )
				: null,
		t = formType == PK_FORM_TYPE_KM ? getSelectedKeyMedia() : null,
		i = document.getElementById('pkKeyMediaSelect'),
		a = formType == PK_FORM_TYPE_KSP ? getSelectedKSP() : null,
		l =
			formType == PK_FORM_TYPE_KSP
				? document.getElementById('pkKSPUserId')
				: null,
		o = null,
		r = null
	return new Promise(function (d, s) {
		switch (formType) {
			case PK_FORM_TYPE_FILE:
				if (null == e.value || '' == e.value)
					return e.focus(), void s('Не обрано файл з ос. ключем')
				if (null == n.value || '' == n.value)
					return n.focus(), void s('Не вказано пароль до ос. ключа')
				readFile(e.files[0])
					.then(function (e) {
						return (
							console.log('Private key file readed'),
							e.file.name.endsWith('.jks')
								? euSign.GetJKSPrivateKeys(e.data).then(function (e) {
										console.log('EndUser: jks keys got', e), (r = [])
										for (var t = 0; t < e[0].certificates.length; t++)
											r.push(e[0].certificates[t].data)
										return euSign.ReadPrivateKeyBinary(
											e[0].privateKey,
											n.value,
											r,
											o
										)
								  })
								: euSign.ReadPrivateKeyBinary(e.data, n.value, r, o)
						)
					})
					.then(function (e) {
						Promise.all([
							euSign
								.GetOwnCertificates()
								.then(function (e) {
									console.log('GetOwnCertificates', e)
								})
								.catch(function (e) {
									console.log('GetOwnCertificates', e)
								}),
						])
							.then(function (n) {
								d(e)
							})
							.catch(function (e) {
								s(e)
							})
					})
					.catch(function (e) {
						s(e)
					})
				break
			case PK_FORM_TYPE_KM:
				if (!t) return i.focus(), void s('Не обрано носій з ос. ключем')
				if (null == n.value || '' == n.value)
					return n.focus(), void s('Не вказано пароль до ос. ключа')
				var c = new EndUserKeyMedia(t)
				;(c.password = n.value),
					euSign
						.ReadPrivateKey(c, r, o)
						.then(function (e) {
							d(e)
						})
						.catch(function (e) {
							s(e)
						})
				break
			case PK_FORM_TYPE_KSP:
				if (null == a) return void s('Не обрано сервіс підпису')
				if (!a.confirmationURL && (null == l.value || '' == l.value))
					return l.focus(), void s('Не вказано ідентифікатор користувача')
				;(document.getElementById('pkKSPQRImageLabel').innerHTML =
					'Відскануйте QR-код для зчитування ос. ключа в моб. додатку:'),
					euSign
						.ReadPrivateKeyKSP(a.confirmationURL ? '' : l.value, a.name)
						.then(function (e) {
							;(document.getElementById('pkKSPQRBlock').style.display = 'none'),
								d(e)
						})
						.catch(function (e) {
							;(document.getElementById('pkKSPQRBlock').style.display = 'none'),
								s(e)
						})
		}
	})
}
async function protectData() {
	var e = document.getElementById('protect-button'),
		n = document.getElementById('pkFilePassword').value,
		t = document.getElementById('spinner')
	;(t.style.display = 'block'), (e.disabled = !0)
	const i = function () {
			;(t.style.display = 'none'), (e.disabled = !1)
		},
		a = 'abc123'
	try {
		const e = readPrivateKey()
		e && console.log('EndUser: private key readed ' + e.subjCN + '.'),
			console.log('text', a)
		const t = await euSign.ProtectDataByPassword(a, n, !0)
		console.log('protectText', t)
		const l = await euSign.UnprotectDataByPassword(t, n, !0)
		console.log('unprotectText', l), i()
	} catch (e) {
		console.error(e), i()
	}
}
function signData() {
	var e = document.getElementById('envelopedOrigin').checked,
		// n = 'text' === document.getElementById('selectWhatToSign').value,
		n = 'file',
		// t = document.getElementById('dataText'),
		t = '',
		i = document.getElementById('dataFile'),
		a = document.getElementById('pkDetails'),
		l = document.getElementById('sign-button'),
		o = document.getElementById('spinner')
	return (
		(o.style.display = 'block'),
		(a.innerHTML = ''),
		(l.disabled = !0),
		n
			? _signData(t.value, e)
			: (console.log(i),
			  console.log(i.files[0]),
			  readFile(i.files[0])
					.then(({ data: n }) => _signData(n, e))
					.catch(e => {
						;(o.style.display = 'none'), (l.disabled = !1)
						var n = e.message || e
						console.error('Fail read data from file: ' + n)
						console.log(
							'Виникла помилка отримання даних з файлу. Опис помилки: ' + n
						)
					})
					.finally(() => {}))
	)
}
function _signData(e, n) {
	var t = document.getElementById('sign-textarea'),
		i = document.getElementById('sign-button'),
		a = document.getElementById('spinner')

	readPrivateKey()
		.then(function (keyInfo) {
			keyInfo &&
				console.log('EndUser: private key readed ' + keyInfo.subjCN + '.')
			console.log('readPrivateKey RESULT:', keyInfo)

			return euSign.GetOwnCertificates().then(e => {
				let certData
				const matchedCert = e?.find(
					cert => cert?.infoEx?.serial === keyInfo.serial
				)
				certData = matchedCert
					? {
							infoEx: matchedCert.infoEx,
							data: arrayBufferToBase64(matchedCert.data),
					  }
					: keyInfo

				pkDetails.innerHTML = JSON.stringify(certData, null, 4).replaceAll(
					'\n',
					'<br>'
				)

				if (formType === PK_FORM_TYPE_KSP) {
					document.getElementById('pkKSPQRImageLabel').innerHTML =
						'Відскануйте QR-код для підпису в моб. додатку:'
				}

				// ⛔ Підпис тексту повністю прибрано, залишено лише файл
				return euSign.SignDataEx(1, e, true, true, n)
			})
		})
		.then(function (signedData) {
			console.log('EndUser: data signed')
			console.log('Data: ' + e)
			console.log('Sign: ' + signedData)

			t.value = signedData // 👈 виводимо в textarea лише підпис

			if (formType === PK_FORM_TYPE_KSP) {
				document.getElementById('pkKSPQRBlock').style.display = 'none'
			}

			a.style.display = 'none'
			i.disabled = false
			console.log('Дані успішно підписані')
			isDocumentSignedSuccess = true
			saveSignData(signedData)
		})
		.catch(function (error) {
			if (formType === PK_FORM_TYPE_KSP) {
				document.getElementById('pkKSPQRBlock').style.display = 'none'
			}
			a.style.display = 'none'
			i.disabled = false

			const msg = error.message || error
			console.log('Sign data error: ' + msg)
			signError = msg
			sendErrorMsg()
			isDocumentSignedSuccess = false
		})
}

function base64ToArrayBuffer(e) {
	let n = window.atob(e),
		t = n.length,
		i = new Uint8Array(t)
	for (let e = 0; e < t; e++) i[e] = n.charCodeAt(e)
	return i
}
function arrayBufferToBase64(e) {
	const n = []
	return (
		e.forEach(e => {
			n.push(String.fromCharCode(e))
		}),
		btoa(n.join(''))
	)
}
function saveSignData(e) {
	console.log('saveSignData event', e)
	if (e)
		try {
			const n = base64ToArrayBuffer(e),
				t = new Blob([n], {
					type: 'application/octet-stream',
				})
			// console.log('t', t)
			window.saveAs(t, '__test_signed_data__.p7s')
			// sendSignedDataToParent(t)
			sendSignedDataToParent(e, t)
		} catch (e) {
			console.error(e)
		}
}
function sendSignedDataToParent(stringBase64, blobData) {
	window.parent.postMessage(
		{
			type: 'signed-data',
			stringBase64,
			blobData,
			isDocumentSignedSuccess,
		},
		'*' // або вкажи конкретний origin замість '*', наприклад: 'http://localhost:81'
	)
}

function sendErrorMsg() {
	window.parent.postMessage(
		{
			type: 'signed-data-error',
			signError,
		},
		'*' // або вкажи конкретний origin замість '*', наприклад: 'http://localhost:81'
	)
}

function clean() {
	try {
		;(document.getElementById('pkFilePassword').value = ''),
			(document.getElementById('pkDetails').innerHTML = ''),
			(document.getElementById('sign-textarea').value = '')
	} catch (e) {
		console.error(e)
	}
}
window.onload = function () {
	try {
		;(document.getElementById('spinner').style.display = 'none'),
			(document.getElementById('sign-button').disabled = !1),
			document.getElementById('pkFile').addEventListener(
				'click',
				function () {
					document.getElementById('pkFilePassword').value = ''
				},
				!1
			),
			document.getElementById('pkFile').addEventListener(
				'change',
				function () {
					document.getElementById('pkFilePassword').value = ''
				},
				!1
			),
			document.getElementById('pkTypeFile').addEventListener(
				'click',
				function () {
					clean(), setLibraryType(PK_FORM_TYPE_FILE)
				},
				!1
			),
			document.getElementById('pkTypeKeyMedia').addEventListener(
				'click',
				function () {
					clean(), setLibraryType(PK_FORM_TYPE_KM)
				},
				!1
			),
			document.getElementById('pkTypeKSP').addEventListener(
				'click',
				function () {
					clean(), setLibraryType(PK_FORM_TYPE_KSP)
				},
				!1
			),
			document.getElementById('pkKSPSelect').addEventListener(
				'change',
				function () {
					var e = getSelectedKSP()
					document.getElementById('pkKSPUserIdBlock').style.display =
						null != e && e.confirmationURL ? 'none' : 'block'
				},
				!1
			),
			// document.getElementById('selectWhatToSign').addEventListener(
			// 	'change',
			// 	function () {
			// 		var e = 'text' === document.getElementById('selectWhatToSign').value
			// 		;(document.getElementById('dataText').style.display = e
			// 			? 'block'
			// 			: 'none'),
			// 			(document.getElementById('dataFile').style.display = e
			// 				? 'none'
			// 				: 'block')
			// 	},
			// 	!1
			// ),
			document
				.getElementById('sign-button')
				.addEventListener('click', signData, !1),
			setLibraryType(PK_FORM_TYPE_FILE)
	} catch (e) {
		console.error(e)
	}
}
