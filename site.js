﻿deferJquery = (method) => {
	if (window.jQuery)
		method();
	else
		setTimeout(() => deferJquery(method), 50);
}

deferValidation = (method) =>
	deferJquery(() => {
		try {
			if ($(document).validate())
				method();
			else
				setTimeout(() => deferValidation(method), 50);
		} catch (error) {
			setTimeout(() => deferValidation(method), 50);
		}
	});

deferMask = (method) =>
	deferJquery(() => {
		try {
			let r = Math.random().toString(36).substring(2);
			let input = document.createElement('input');
			input.id = r;
			document.body.append(input);
			$("#" + r).mask("9");
			$("#" + r).remove();
		} catch (error) {
			setTimeout(() => deferMask(method), 50);
		}
	})

function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

var lang = getCookie('lang');

if (lang == null) {
	setCookie('lang', 'sq-al', 7);
	lang = getCookie('lang');
}

function submitAppointment(idService, token) {
	var obj = {
		IDService: idService,
		FormData: JSON.stringify(getFormData($("form"))),
		ReCaptcha: token
	};
	$.ajax({
		url: $("form").attr("action"),
		type: "POST",
		cache: false,
		dataType: 'json',
		contentType: 'application/json',
		timeout: 10000,
		data: JSON.stringify(obj),
		complete: (result) => {
			switch (result.responseJSON.status) {
				case 0:
					setTimeout(() => $('.loader').show(), 1);
					let url = '/Appointments/Download/' + result.responseJSON.singleData;
					let date = $("div[data-day-parent].scheduleSelected").text().replace(/\//g, '_');
					let time = $("div[data-idschedule].scheduleSelected").text();
					inlineDownload(url, "Termini", () => window.location.href = `/ServicesMS/3/${date}/${time}`);
					break;
				case -10:
					setTimeout(() => {
						popup(arrLang[lang]["NOTIFY"], arrLang[lang]["ROBOT"]);
						$('.loader').hide();
					}, 20);
					break;
				case 19:
					setTimeout(() => {
						popup(arrLang[lang]["NOTIFY"], arrLang[lang]["ERROR-OCCURED"]);
						$('.loader').hide();
					}, 20);
					break;
				case 30:
					setTimeout(() => {
						popup(arrLang[lang]["NOTIFY"], arrLang[lang]["LIMIT-MPB-APPOINTMENT-EXCEEDED"]);
						$('.loader').hide();
					}, 20);
					break;
				default:
					window.location.href = '/ServicesMS/-1';
					break;
			}
		},
		error: (result) => {
			window.location.href = '/ServicesMS/-1';
		}
	});
}

function getFormData($form) {
	var unindexed_array = $form.serializeArray();
	var indexed_array = {};
	$.map(unindexed_array, (n, i) => indexed_array[n['name']] = n['value']);
	return indexed_array;
}

function uploadPhotos(source, id, ios) {
	if (ios) {
		document.getElementById(id + 'Compress').value = source;
		return;
	}
	var image = new Image();
	image.onload = function () {
		var canvas = document.createElement('canvas'),
			max_size = 800,
			width = image.width,
			height = image.height;
		if (width > height && width > max_size) {
			height *= max_size / width;
			width = max_size;
		} else if (height > max_size) {
			width *= max_size / height;
			height = max_size;
		}
		canvas.width = width;
		canvas.height = height;
		canvas.getContext('2d').drawImage(image, 0, 0, width, height);
		var dataUrl = canvas.toDataURL('image/jpeg');
		document.getElementById(id + 'Compress').value = dataUrl;
	}
	image.src = source;
}

removeCharacterAtIndex = (value, index) => value.substring(0, index) + value.substring(index + 1);

var isMobileDevice = function () { return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) == true; }

$("input").keyup(function (event) {
	if (event.keyCode === 13) {
		event.preventDefault();
		$(this).closest('table').find('button').click();
	}
});

var isImage = file => file['type'].includes('image');

$('.btn-option').click(e => {
	$(e.target.parentElement).toggleClass('open');
	if (isMobileDevice())
		$('.btn-option').next().bind('click', function () {
			$(this).parent().removeClass('open');
			$(this).unbind('click');
		});
});

var KosovoDateTime = (str) => new Date(str).toLocaleString('en-GB').split(",")[0];

var KosovoDateTimeFull = (str) => new Date(str).toLocaleString('en-GB');

var KosovoDateCompatible = (str) => new Date(str.split("T")[0]).toLocaleString('en-GB').split(",")[0];

var AddCommas = (str) => str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ".00";

$(".custom-dropdown .options span.option").not('.disabled').click(function () {
	if ($(this).hasClass('disabled'))
		return;
	$('.custom-dropdown .options span.option').removeClass('selected');
	$(this).addClass('selected');
	$(this).parent().prev().text($(this).text());
	$(this).parent().parent().find(`select`).val($(this).attr('data-value')).trigger('change');
});

function TermsModal() {
	GenericModal('/Home/TermsData');
}

function PrivacyModal() {
	GenericModal('/Home/PrivacyData');
}

function AboutModal() {
	GenericModal('/Home/AboutData');
}

function GenericModal(link) {
	var title = link.split('/')[link.split('/').length - 1];
	title = title.replace('Data', '');
	switch (title) {
		case 'Terms': title = 'TERMS-USE'; break;
		case 'Privacy': title = 'PRIVACY'; break;
		case 'About': title = 'ABOUT'; break;
	}
	$.ajax({
		url: link,
		type: "GET",
		complete: function (e) {
			popup(arrLang[lang][title], e.responseText);
			$(".popup-content").css("max-width", "850px")
			$(".popup-content .body").css("max-height", "650px")
		}
	});
}

$('input.search').keyup(function () {
	if ($(this).val() == "") {
		$('.sv-content a.btn-service').each(function (e) {
			$(this).removeClass('hidden');
		});
		return;
	}
	let value = $(this).val().toLowerCase();
	$('.sv-content a.btn-service').each(function (e) {
		if (!$(this).find('p').text().toLowerCase().trim().includes(value))
			$(this).addClass('hidden');
		else $(this).removeClass('hidden');
	});
});

$('input.search').keyup(function () {
	if ($(this).val() == "") {
		$('.mf-content div').each(function (e) {
			$(this).removeClass('hidden');
		});
		return;
	}
	let value = $(this).val().toLowerCase();
	$('.mf-content div').each(function (e) {
		if (!$(this).find('a').find('h1').text().toLowerCase().trim().includes(value))
			$(this).addClass('hidden');
		else $(this).removeClass('hidden');
	});
});

$("a").not("[href='#'], [href^='tel'], [href^='mailto'], [href='javascript:void(0)'], [target='_blank']").click(e => !e.ctrlKey ? $('.loader').show() : void (0));

$(".file input[type='file']").change(function () {
	let files = $(this).get(0).files;
	if (files.length > 0) {
		if (!isImage(files[0])) {
			alert(arrLang[lang]["FORMAT-REQUIRED"]);
			var holder = $(this).parent().parent();
			$(holder).find('div img').attr('src', '');
			$(holder).find('div img').css('display', 'none');
			return false;
		}
		$(this).prev().text("");
		[...files].forEach(f => $(this).prev().text($(this).prev().text() + ", " + f.name));
		$(this).prev().text($(this).prev().text().substr(1));
		$(this).parent().addClass('done');
	}
	else {
		if ($(this).attr('data-default-text'))
			$(this).prev().text($(this).attr('data-default-text'));
		else
			$(this).prev().text("Kliko këtu për të ngarkuar nje fajll");
		$(this).parent().removeClass('done');
		var holder = $(this).parent().parent();
		$(holder).find('div img').attr('src', '');
		$(holder).find('div img').css('display', 'none');
	}
});

String.prototype.isNumber = function () { return /^\d+$/.test(this); }

var alphaOnly = function (r) { return r.charCode >= 65 && r.charCode <= 90 || r.charCode >= 97 && r.charCode <= 122 || 199 === r.charCode || 203 === r.charCode || 231 === r.charCode || 235 === r.charCode || 32 === r.charCode; }

var True = true; var False = false;

var _0x7d4c = ["\x63\x68\x61\x6E\x67\x65",
	"\x23\x41\x63\x63\x65\x70\x54\x65\x72\x6D\x73",
	"\x54\x65\x72\x6D\x73\x41\x63\x63\x65\x70\x74\x65\x64",
	"\x63\x68\x65\x63\x6B\x65\x64", "\x6F\x6E",
	"\x39\x39\x39\x39\x39\x39\x39\x39\x39\x39",
	"\x69\x6E\x70\x75\x74\x6D\x61\x73\x6B",
	"\x23\x50\x65\x72\x73\x6F\x6E\x61\x6C\x49\x64",
	"\x39\x39\x39\x39\x20\x39\x39\x39\x39\x20\x39\x39\x39\x39\x20\x39\x39\x39\x39",
	"\x23\x42\x61\x6E\x6B\x41\x63\x63\x6F\x75\x6E\x74",
	"\x6B\x65\x79\x75\x70", "\x50\x65\x72\x73\x6F\x6E\x61\x6C\x49\x64",
	"\x69\x73\x2D\x69\x6E\x76\x61\x6C\x69\x64", "\x61\x64\x64\x43\x6C\x61\x73\x73",
	"\x75\x6E\x6D\x61\x73\x6B\x65\x64\x76\x61\x6C\x75\x65",
	"\x67\x65\x74\x45\x6C\x65\x6D\x65\x6E\x74\x42\x79\x49\x64",
	"\x6C\x65\x6E\x67\x74\x68", "\x72\x65\x6D\x6F\x76\x65\x43\x6C\x61\x73\x73",
	"\x42\x61\x6E\x6B\x4E\x6F", "\x42\x61\x6E\x6B\x41\x63\x63\x6F\x75\x6E\x74",
	"\x74\x72\x69\x6D", "\x76\x61\x6C", "", "\x64\x69\x73\x61\x62\x6C\x65\x64",
	"\x72\x65\x6D\x6F\x76\x65\x41\x74\x74\x72",
	"\x2E\x50\x65\x72\x73\x6F\x6E\x61\x49\x6E\x66\x6F\x53\x75\x62\x6D\x69\x74",
	"\x61\x74\x74\x72", "\x73\x75\x62\x73\x74\x72\x69\x6E\x67", "\x74\x72\x75\x6E\x63",
	"\x39", "\x68\x65\x69\x67\x68\x74", "\x62\x6F\x64\x79", "\x61\x62\x73\x6F\x6C\x75\x74\x65",
	"\x30\x70\x78", "\x63\x73\x73", "\x23\x66\x6F\x6F\x74\x65\x72",
	"\x72\x65\x6C\x61\x74\x69\x76\x65", "\x72\x65\x61\x64\x79"];

function modulo11(_0x5afex7) {
	if (_0x5afex7[_0x7d4c[27]](0, 1) == _0x7d4c[29]) return true;
	let _0x5afex10 = [0, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	let _0x5afex11 = 0;
	if (_0x5afex7[_0x7d4c[16]] != 10) return false;

	for ($i = 1; $i <= 9; $i++)
		_0x5afex11 += _0x5afex7[_0x7d4c[27]]($i - 1, $i) * _0x5afex10[$i];
	_0x5afex11 = 11 - _0x5afex11 % 11;
	if (_0x5afex11 == 10) _0x5afex11 = 0;
	return _0x5afex7[_0x7d4c[27]](9, 10) == _0x5afex11;
}

window.onclick = function (event) {
	switch (event.target) {
		case document.getElementById('modalTC'):
			$("#modalTC").fadeOut("fast");
			setTimeout(function () { $("#contentTC").html(""); }, 200); break;
		case document.getElementById('ModalTC'):
			$("#ModalTC").fadeOut("fast");
			setTimeout(function () { $("#ContentTC").html(""); }, 200); break;
	}
}

function titleCase(str) {
	return str.toLowerCase().charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}

$("#logo").click(() => window.location.href = "/");

$(".social-icons p").click(function () {
	var social = "";
	switch ($(this).find('img').attr("alt")) {
		case 'twitter':
			social = 'twitter.com'; break;
		case 'instagram':
			social = 'instagr.am'; break;
		default:
			social = 'fb.me'; break;
	}
	window.location.href = `https://${social}/ekosovaplatform`;
});

var popup = (title, content, custom) => {
	$(".popup").remove();
	$(`<div class="popup" role="dialog">
		<div class="popup-content">
			${title && isMobileDevice() ? `<div class='header'><h4 class='m-0'>${title}</h4></div>` : `<div class='header'><h3 class='m-0'>${title}</h3></div>`}
			<div class='body'>
				<p>${content}</p>
			</div>
				<div class='footer'>
				<button role="button" class="btn btn-flat-default auto-margin mw-100 w-100">${custom ?? arrLang[lang]["CLOSE"]}</button>
				</div>
             </div>
        </div>`).appendTo($('body'));
	setTimeout(() => $(".popup").addClass('shown'), 10);
	$(".popup-content .footer button").click('click', (e) => {
		$("div.popup").removeClass('shown');
		setTimeout(() => $("div.popup").remove(), 500);
		$(document).unbind('keydown');
	});
	function escape(e) {
		if (e === "Escape" || e === "Esc")
			$(".popup-content .footer button").click();
	}
	$(document).on('keydown', (e) => escape(e.key));
}

function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

$("[data-platform]").click(() => popup(arrLang[lang]["SOON"], arrLang[lang]["APP-UNAVAILABLE"]));

$("#Profile").change(function () {
	switch ($(this).val()) {
		case '0':
			RedirectWithLoader("/Profile");
			break;
		case '5':
			RedirectWithLoader("/Profile/Logout");
			break;
	}
});

$(document).click(() => $("#notificationContainer").hide());

$("#btnNotification").click(function () {
	$.post('/Profile/NotificationRead');
	$("#notificationContainer").fadeToggle(300);
	setTimeout(() => $("#btnNotification span").text("0"), 100);
	return false;
});

$("#notificationContainer").click(() => false);

$("#notificationFooter").on('click', () => RedirectWithLoader('/Profile?notify'));

$(document).ready(function () {
	let gdpr = getCookie('gdpr');

	if (!gdpr && $("*[key=MAINTENANCE-MODE]").length == 0) {
		$(`<div class="cookie-settings">
				<div class="flex-center-h">
				    <p class="mr-2">${arrLang[lang]['COOKIE-SETTINGS']}</p>
				    <button role="button" class="closeThis btn btn-default ${isMobileDevice() ? 'mb-1' : 'mr-2'}">OK</button>
				    <button role="button" class="closeThis btn btn-outline-default lang" key='REJECT'>${arrLang[lang]['REJECT']}</button>
				</div>
			</div>`).appendTo($('body'));
		$(".closeThis").bind('click', () => {
			var date = new Date();
			date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
			var expires = "expires=" + date.toUTCString();
			document.cookie = 'gdpr=1;' + expires + ";path=/";
			$(".cookie-settings").remove();
		});
	}

	$(`.translate[id=${lang}]`).addClass('active');

	$(".lang").each(function (index, element) {
		if ($(this).is("input") || $(this).is("textarea"))
			$(this).attr('placeholder', arrLang[lang][$(this).attr("key")]);
		else
			$(this).html(arrLang[lang][$(this).attr("key")]);
	});

	$(".translate").click(function () {
		setCookie('lang', $(this).attr('id'), 7);
		var lang = getCookie('lang');
		$(".lang").each(function (index, element) {
			if ($(this).is("input") || $(this).is("textarea"))
				$(this).attr('placeholder', arrLang[lang][$(this).attr("key")]);
			else
				$(this).html(arrLang[lang][$(this).attr("key")]);
		});
		$(`.translate`).removeClass('active');
		$(`.translate[id=${lang}]`).addClass('active');
		if ($("form").length > 0) window.location.reload()
	});

	$(document).on("click", "a:not([href='#'], [href^='tel'], [href^='mailto'], [href='javascript:void(0)'], [target='_blank'])", function () {
		setTimeout(() => $('.loader').show(), 50);
	});

	$(".loader").hide();
});

$(window).bind("pageshow", function (event) {
	if (event.originalEvent.persisted)
		window.location.reload()
});

$(document).on('click', '*[youtube-url]', function () {
	$(".popup").remove();
	RedirectWithLoader('/Video/' + $(this).attr('youtube-url'));
});

var videoGuidesPopup = (loggedIn) => popup(arrLang[lang]["VIDEO-GUIDES"], `<div class="videoRows">
		${(loggedIn ? `` : `<div youtube-url='gxZ-dYiRKE8' style='display: flex;align-items:center'><div>${arrLang[lang]['gxZ-dYiRKE8']}</div><div><img src='https://cdn1.iconfinder.com/data/icons/logotypes/32/youtube-512.png' style='margin: 0 auto;display: block;'><span style='font-size: .75em;'>${arrLang[lang]["WATCH"]}</span></div></div>`)}
		<div youtube-url="rVnjB5areQA" style='display: flex;align-items:center'><div>${arrLang[lang]['rVnjB5areQA']}</div><div><img src='https://cdn1.iconfinder.com/data/icons/logotypes/32/youtube-512.png' style='margin: 0 auto;display: block;'><span style='font-size: .75em;'>${arrLang[lang]["WATCH"]}</span></div></div>
		<div youtube-url="dkVFsWgfj8w" style='display: flex;align-items:center'><div>${arrLang[lang]['dkVFsWgfj8w']}</div><div><img src='https://cdn1.iconfinder.com/data/icons/logotypes/32/youtube-512.png' style='margin: 0 auto;display: block;'><span style='font-size: .75em;'>${arrLang[lang]["WATCH"]}</span></div></div>`);

var formatter = new Intl.NumberFormat('de', {
	style: 'currency',
	currency: 'EUR'
});

function dateIfNotNull(str) {
	var null_date = new Date(0);
	if (str == null || str == null_date)
		return arrLang[lang]["NO-DATA"];
	try {
		return KosovoDateTimeFull(str);
	}
	catch {
		return arrLang[lang]["NO-DATA"];
	}
}

function inlineDownload(url, name = null, callback = null) {
	setTimeout(() => $(".loader").show(), 1);
	var req = new XMLHttpRequest();
	req.open("GET", url, true);
	req.responseType = "blob";
	req.onload = function (event) {
		if (req.status != 200) {
			popup(arrLang[lang]["NOTIFY"], arrLang[lang]["SERVER-ERROR"]);
			setTimeout(() => $(".loader").hide(), 1);
			return;
		}
		var link = document.createElement('a');
		link.href = window.URL.createObjectURL(req.response);
		link.download = (name ?? "Dokumenti") + ".pdf";
		link.click();
		if (callback)
			callback();
	};
	req.send();
}

$("div[data-day-parent]").click((e) => {
	if ($(e.currentTarget).hasClass("scheduleSelected")) {
		$("div[data-day-child]").fadeOut("fast");
		setTimeout(() => $(`div[data-day-parent]`).fadeIn("fast"), 400);
		$(e.currentTarget).removeClass("scheduleSelected");
		$(`div[data-idschedule]`).removeClass("scheduleSelected");
		$("#IDHourSchedule").val("");
	}
	else {
		let clicked = e.currentTarget.getAttribute("data-day-parent");
		$(`div[data-day-parent][data-day-parent!=${clicked}]`).fadeOut("fast");
		$(`div[data-day-parent=${clicked}]`).addClass("scheduleSelected");
		setTimeout(() => $("div[data-day-child=" + clicked + "]").fadeIn("fast"), 400);
	}
});

$("div[data-idschedule]").click((e) => {
	let clicked = e.currentTarget.getAttribute("data-idschedule");
	$(`div[data-idschedule]`).removeClass("scheduleSelected");
	$(`div[data-idschedule=${clicked}]`).addClass("scheduleSelected");
	$("#IDHourSchedule").val(clicked);
});

simpleValidMail = (userInput) => /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i.test(userInput);

function copyToClipboard(text) {
	var textArea = document.createElement("textarea");
	textArea.value = text;
	textArea.style.top = "0";
	textArea.style.left = "0";
	textArea.style.opacity = "0";
	textArea.style.position = "fixed";
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	document.execCommand('copy');
	document.body.removeChild(textArea);
}

function RedirectWithLoader(url) {
	$(".loader").show();
	$(".popup").hide();
	window.location.href = url;
}

propTaxInstLookup = (uniref) => {
	return {
		'PR': "481_10",
		'DE': "360_10",
		'FE': "370_10",
		'FK': "375_10",
		'GJ': "380_10",
		'GL': "385_10",
		'GG': "390_10",
		'HE': "395_10",
		'TG': "400_10",
		'JU': "415_10",
		'KA': "420_10",
		'KL': "425_10",
		'LE': "430_10",
		'LP': "435_10",
		'ML': "440_10",
		'MU': "445_10",
		'MC': "450_10",
		'NB': "455_10",
		'BQ': "460_10",
		'PE': "465_10",
		'PD': "470_10",
		'KM': "475_10",
		'DG': "485_10",
		'PZ': "490_10",
		'RH': "495_10",
		'SP': "500_10",
		'ST': "505_10",
		'SK': "510_10",
		'SU': "515_10",
		'VT': "520_10",
		'VU': "525_10",
		'ZU': "530_10",
		'ZV': "535_10",
		'PT': "364_10",
		'GR': "361_10",
		'RA': "362_10",
		'LO': "363_10"
	}[uniref.substring(0, 2)];
}

replaceAll = (str, find, replace) => str.replace(new RegExp(find, 'g'), replace);


JsGuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
	var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
	return v.toString(16);
});

function CommitPayment(serviceId, uniref, externalIdentifier, institutionCode) {
	var paymentMethod = $("input[name=paymentOption]:checked").val(),
		toPay = "0.00",
		specificHook = $("#paymentSpecifiedHook").val();

	if (paymentMethod == "-1")
		if (isNaN(parseFloat(specificHook)) || parseFloat(specificHook) <= 0) {
			$("#paymentSpecifiedHook").addClass("error");
			return;
		}
		else
			toPay = parseFloat(specificHook).toFixed(2);
	else
		if (isNaN(parseFloat(paymentMethod / 100)) || parseFloat(paymentMethod / 100) == 0)
			return;
		else
			toPay = parseFloat(paymentMethod / 100).toFixed(2);

	if (parseFloat(toPay) > 0)
		window.location.href = `/Services/ConfirmPayment/${serviceId}?Uniref=${uniref}&ExternalIdentifier=${externalIdentifier}&InstitutionCode=${institutionCode}&ToPay=${toPay}`;
}

GeneratePaymentPopup = (serviceId, uniref, externalIdentifier, institutionCode, fullPayment) => {
	lang = getCookie('lang');
	popup(arrLang[lang]["PAYMENT-SPECIFIC-TITLE"],
		`<table style='background:0;padding:0'>
			<tr><td style='text-align:left!important'><label><input type='radio' name='paymentOption' value='${fullPayment}' checked="checked"/> ${arrLang[lang]["PAYMENT-SPECIFIC-FULL"]}</label></td><td class='text-right'><label>${parseFloat(fullPayment/100).toFixed(2)} €</label></td></tr>
			<tr><td><label><input type='radio' name='paymentOption' id='paymentSpecified' value='-1' /> ${arrLang[lang]["PAYMENT-SPECIFIC-SPECIFIC"]}</label></td><td class='text-right'><input type='number' id='paymentSpecifiedHook' placeholder='0.00'/> €</td></tr>
			</table>
		<button type='button' class='btn btn-outline-default bg-white auto-margin mb-2 w-66' onclick='CommitPayment(${serviceId}, "${uniref}", "${externalIdentifier}", "${institutionCode}")'>${arrLang[lang]["CONTINUE"]}</button>`);
}