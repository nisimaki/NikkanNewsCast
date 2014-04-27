var metaId; //現在の動画ID
var player;
var activeMid;
var contentInfoAll; //getAllMedia（全動画）で取ってきたメタ情報
var contentInfoTab; //タブカテゴリ動画部分用にキーワードで取ってきたメタ情報
var contentInfoRelated; //関連動画部分用にキーワードで取ってきたメタ情報
var contentInfoId; //特定動画IDで取ってきたメタ情報（1件のみ）
var currentMovieKeyword; //現在の動画のキーワード
var pubDate; //公開開始日
var midFlg = -1; //URLにパラメータを付けて、特定の動画を見に来た場合用設定
var alreadyPlayed = false;
var userAgent = window.navigator.userAgent.toLowerCase();



if(document.location.href.indexOf('#movie') > 0){ //URLにパラメータを付けて、特定の動画を見に来た場合にその番号でフラグを設定
	var url = document.location.href;
	var movie = url.substr(url.indexOf('#movie') + 6);
	midFlg = movie;
}



// callApi()の場合分け&jsonpに投げる
function callApi(command, keyword, option){
	if(command === "getAllMedia"){ //全動画情報取得（上限100件）
		//loadJsonpEq(command, 100, 1,"publish_desc", "getAllMedia"); 全動画取得から全キーワードでの取得に変更
		loadJsonpEq("getMediaByTag", "a001000|a002000|a003000|a004000|a005000|a006000|a007000|a008000|a009000|a010000", 100, 1,"publish_desc", "getAllMedia");
	} else if(command === "getMediaByTag"){ //キーワードにヒットする動画情報取得
		if(option === "relatedMovie"){
			loadJsonpEq(command, keyword, 100, 1,"publish_desc", "relatedMovie");
		} else {
			loadJsonpEq(command, keyword, 100, 1,"publish_desc", "mainMovie");
		}
	} else if(command === "getMediaById"){ //特定動画IDで動画情報取得（1件のみ）
		loadJsonpEq(command, keyword, "getMediaById");
	}
	//console.log('callApi End');
}



//jsonpで取ったデータを場合分け
function searchResultEq(result, p1){
	if(result.response_status === "2000"){
		if(p1 === "mainMovie"){ //タブカテゴリ動画部分生成
			contentInfoTab = result;
			//console.log(contentInfoTab);
			createMainMoviePlaylist(contentInfoTab);
			setPlayer(0, false, contentInfoTab);
		} else if(p1 === "getAllMedia"){ //動画ニュース一覧部分生成
			contentInfoAll = result;
			//console.log(contentInfoAll);
			createNewsAllPlaylist(contentInfoAll);
		} else if(p1 === "relatedMovie"){ //関連動画部分生成
			contentInfoRelated = result;
			for (var i = 0; i < contentInfoRelated.meta.length; i++){ //関連動画リストから現在の動画を抜く
				if(contentInfoRelated.meta[i].mid == metaId){
					contentInfoRelated.meta.splice(i, 1);
				}
			};
			//console.log(contentInfoRelated);
			createRelatedMoviePlaylist(contentInfoRelated);
		} else if(p1 === "getMediaById"){ //特定動画IDを再生
			contentInfoId = result;
			//console.log(contentInfoId);
			setPlayer(0, false, contentInfoId);
		}
	} else {
		alert("動画の取得に失敗しました。。: " + result.response_status);
	}
	//console.log('searchResultEq End');
}



//動画プレーヤー生成&関連動画生成関数
function setPlayer(id, ad, contentInfo){
	var playerId;

	if(ad == true){
		playerId = 3;
		metaId = 41;
	} else if (alreadyPlayed){
		playerId = 2;
		metaId = contentInfo.meta[id].mid;
	} else if (midFlg > -1) { //URLにパラメータを付けて、特定の動画を見に来た場合
		playerId = 1;
		for (var i = 0; i < contentInfo.meta.length; i++){
			if (contentInfo.meta[i].mid == midFlg){
				id = i;
			}
		}
		metaId = contentInfo.meta[id].mid;
	} else {
		playerId = 1;
		metaId = contentInfo.meta[id].mid;
	}

//動画プレーヤー
	player = jstream.PlayerFactoryOBJ.create({
	 base: "eqa514ffey.eq.webcdn.stream.ne.jp/www50/eqa514ffey/jmc_pub/jmc_swf/player/",
	 contract_id: 862,
	 meta_id: metaId,
	 player_id: playerId,
	 width: 640,
	 height: 360
	}, "eqPlayer");
	
	activeMid = metaId;
	alreadyPlayed = true;

//動画タイトル&説明文
	var mainMovieDetail = document.getElementById('mainMovieDetail');
	if(userAgent.indexOf('msie') != -1) {
		mainMovieDetail.getElementsByTagName('h4')[0].innerText = '';
	} else {
		mainMovieDetail.getElementsByTagName('h4')[0].textContent = '';
	}
	if(contentInfo.meta[id].publication_date){
		pubDate = contentInfo.meta[id].publication_date;
	}
	//console.log(contentInfo.meta[id]);
	mainMovieDetail.getElementsByTagName('h4')[0].appendChild(document.createTextNode(contentInfo.meta[id].title + ' [ update:' + contentInfo.meta[id].publication_date + ']'));
	document.getElementById('readMore').innerHTML = '';
	document.getElementById('readMore').innerHTML = contentInfo.meta[id].long_description;

	readMore();
	heightMatch();

//現在の動画のキーワードを取得して関連動画リスト生成
	if(contentInfo.meta[id].api_keywords){
		var preCurrentMovieKeyword = contentInfo.meta[id].api_keywords;
		currentMovieKeyword = preCurrentMovieKeyword.replace(/;/g,'|').replace(/a00[1-9]000/g,'').replace(/\|+/g,'|').replace(/^\|/,'');
		callApi("getMediaByTag", currentMovieKeyword, "relatedMovie");
		//console.log(currentMovieKeyword);
	}

	function createTweetBtn(){ //現在の動画の情報が入ったtweetボタン生成
		var socialBtn = document.getElementById('socialBtn');
		var a = document.createElement('a');
		a.className = 'twitter-share-button';
		a.innerHTML = 'tweet';
		a.setAttribute('href','https://twitter.com/share');
		a.setAttribute('data-lang','ja');
		a.setAttribute('data-text', contentInfo.meta[id].title + ' | 日刊工業新聞 News cast');
		a.setAttribute('data-url', url + '#movie' + metaId);
		a.setAttribute('data-count', 'horizontal');
		socialBtn.appendChild(a);
		twttr.widgets.load();
	}

//現在の動画のmidナンバーを「#movie」の後ろに付けてURLを差し替え
	if(document.location.href.indexOf('#movie') > 0){
		var url = document.location.href.replace(/#movie\d+/, '');
		document.location.href = url + '#movie' + metaId;
		createTweetBtn();
	} else {
		var url = document.location.href;
		document.location.href = url + '#movie' + metaId;
		createTweetBtn();
	}

	if(userAgent.indexOf('msie') != -1) {
		function titleRewrite(){document.title = '日刊工業新聞 News cast'};
		setTimeout(titleRewrite, 1000);
	}

	//console.log('setPlayer End');
	return;
}



//メイン動画横リスト生成関数
function createMainMoviePlaylist(contentInfoTab){
	var ul = document.createElement('ul');

	for (var i = 0; i < contentInfoTab.meta.length; i++){
		var a = document.createElement('a');
		a.href="javascript:void(0)";

		// cross browser :(
		if(document.documentMode && document.documentMode >= 8 || !document.all){
			a.setAttribute("onclick", "setPlayer(" + i + " ,false" + " ,contentInfoTab" +");");
		} else {
			a.setAttribute("onclick", new Function("setPlayer(" + i + " ,false" + " ,contentInfoTab" +");"));
		}

		var li = document.createElement('li');
		li.className = "mainMovieListBox";
		var div = document.createElement('div');
		var img = document.createElement('img');
		img.src = contentInfoTab.meta[i].small_thumbnail_url;
		img.width = 100;
		img.height = 57;

		var p = document.createElement('p');
		p.appendChild(document.createTextNode(contentInfoTab.meta[i].title));
		div.appendChild(img);
		a.appendChild(div);
		a.appendChild(p);
		li.appendChild(a);
		ul.appendChild(li);
	}

	document.getElementById('mainMovieList').appendChild(ul);
	toScrlMainMovie();

	//console.log('createPlaylist End');
	return;
}



//動画ニュース一覧リスト生成関数
function createNewsAllPlaylist(contentInfoAll){
	var ul = document.createElement('ul');
	ul.className = "clearfix";

	for (var i = 0; i < 48; i++){
		var a = document.createElement('a');
		a.href="javascript:void(0)";

		// cross browser :(
		if(document.documentMode && document.documentMode >= 8 || !document.all){
			a.setAttribute("onclick", "setPlayer(" + i + " ,false" + " ,contentInfoAll" +");");
		} else {
			a.setAttribute("onclick", new Function("setPlayer(" + i + " ,false" + " ,contentInfoAll" +");"));
		}

		var li = document.createElement('li');
		var div = document.createElement('div');
		var img = document.createElement('img');
		img.src = contentInfoAll.meta[i].small_thumbnail_url;
		img.width = 150;
		img.height = 85;
		var p = document.createElement('p');
		
		p.appendChild(document.createTextNode(contentInfoAll.meta[i].title));
		div.appendChild(img);
		a.appendChild(div);
		a.appendChild(p);
		li.appendChild(a);
		ul.appendChild(li);
	}

	document.getElementById('newsAll').appendChild(ul);
	toScrlMainMovie();

//console.log('createNewsAllPlaylist End');
	return;
}



//関連動画リスト生成関数
function createRelatedMoviePlaylist(contentInfoRelated){
	var ul = document.createElement('ul');
	ul.className = "bxslider";
	ul.id = "bxsliderRelated";
	var li = document.createElement('li');
	li.className = "clearfix";
	var sliderLBoxArry = [];

	for (var i = 0; i < contentInfoRelated.meta.length; i++){
		var a = document.createElement('a');
		a.href="javascript:void(0)";

		// cross browser :(
		if(document.documentMode && document.documentMode >= 8 || !document.all){
			a.setAttribute("onclick", "setPlayer(" + i + " ,false" + " ,contentInfoRelated" +");");
		} else {
			a.setAttribute("onclick", new Function("setPlayer(" + i + " ,false" + " ,contentInfoRelated" +");"));
		}

		var divSliderBox = document.createElement('div');
		divSliderBox.className = "sliderLBox";
		var div = document.createElement('div');
		var img = document.createElement('img');
		img.src = contentInfoRelated.meta[i].small_thumbnail_url;
		img.width = 140;
		img.height = 79;
		var p = document.createElement('p');
		p.appendChild(document.createTextNode(contentInfoRelated.meta[i].title));
		div.appendChild(img);
		a.appendChild(div);
		a.appendChild(p);
		divSliderBox.appendChild(a);
		sliderLBoxArry.push(divSliderBox);
	}

	//動画データが4つ以下の場合、4つ以上の場合に分ける。
	//さらに、4つ以上の場合、順番に4個1組にまとめ、最後の4つ未満の動画データはそれだけでまとめる。
	var sliderLBoxArrylength = sliderLBoxArry.length;
	if(sliderLBoxArrylength <= 4){
		for (var i = 0; i < sliderLBoxArrylength; i++){
			li.appendChild(sliderLBoxArry[i]);
		}
		if(i === 4){
			li.lastChild.className = "sliderLBox last";
		}
		ul.appendChild(li);
	} else if(sliderLBoxArrylength > 4){
		var remainder = sliderLBoxArrylength % 4;
		//console.log(remainder);
		for (var i = 1; i < sliderLBoxArrylength + 1; i++){
			li.appendChild(sliderLBoxArry[i - 1]);
			if(i%4 === 0){
				li.lastChild.className = "sliderLBox last";
				ul.appendChild(li);
				var li = document.createElement('li');
				li.className = "clearfix";
			}
		}
		if(remainder !== 0){
			ul.appendChild(li);
		}
	}

	//2回目以降の関連動画生成の場合、既存の関連動画部分を削除の上、新しいものを生成
	if(document.getElementById('relatedMovie').getElementsByTagName('div')[1]){
		var bxWrapper = document.getElementById('relatedMovie').getElementsByTagName('div')[1];
		bxWrapper.parentNode.removeChild(bxWrapper);
		document.getElementById('relatedMovie').appendChild(ul);
		slider();
	} else {
		document.getElementById('relatedMovie').appendChild(ul);
		slider();
	}

	toScrlMainMovie();
	//console.log('createRelatedMoviePlaylist End');
	return;
}



//console.log('js End');