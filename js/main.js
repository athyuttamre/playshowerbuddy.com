$(document).ready(function(){
	R.ready(function(){
		if(R.authenticated()) {
			authenticationComplete();
		} else {
			notAuthenticated();
		}
	});

	$("#authorize").click(function(){
		R.authenticate({
			complete: function(authenticated){
				if(authenticated) {
					console.log("User authenticated");
					authenticationComplete();
				}
			},
			mode: 'redirect'
		})
	});

	var currentInterimTranscript = '';
	var finalTranscript = '';
	var recognizing = false;
	var finishedListening = false;

	if(!('webkitSpeechRecognition' in window)) {
		alert("Sorry, your Browser does not support the Speech API.");
	} else {
		var recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = 'en-US';

		recognition.onstart = function() {
			recognizing = true;
			console.log("Listening now. Speak clearly.");
		}

		recognition.onerror = function() {
			console.log("Recognition error.");
		}

		recognition.onend = function() {
			recognizing = false;
			if(finishedListening) {
				console.log("Ending recognition.");
			} else {
				console.log("Restarting recognition.");
				startRecording();
			}
		}

		recognition.onresult = function(event) {
			var savedFinalTranscript = finalTranscript;
			currentInterimTranscript = '';

			for(var i = event.resultIndex; i < event.results.length; i++) {
				if(event.results[i].isFinal) {
					finalTranscript += event.results[i][0].transcript;
				} else {
					currentInterimTranscript += event.results[i][0].transcript;
				}
			}

			console.log("interim: '" + currentInterimTranscript + "'");
			console.log("final: '" + finalTranscript + "'");

			var cIT = currentInterimTranscript.trim();
			if(cIT == "pause" || cIT == "stop" || cIT == "paws" || cIT == "top") {
				R.player.pause();
			}

			if(cIT == "play" || cIT == "continue") {
				R.player.play();
			}

			var newWords = finalTranscript.replace(savedFinalTranscript, '').trim();
			console.log("final transcript newWords: '" + newWords + "'");
			if(newWords == 'pause' || newWords == 'stop' || newWords == 'paws' || newWords == 'top') {
				R.player.pause();
			} else if(newWords == 'play' || newWords == 'continue' || newWords == 'stock' || newWords == 'talk') {
				R.player.play();
			}

			// if(finalTranscript.length > 0) {
			// 	console.log("final final transcript: " + finalTranscript);
			// 	recognition.stop();
			// 	recognizing = false;
			// }
		}
	}

	function authenticationComplete() {
		R.ready(function() {
			var name = R.currentUser.attributes.firstName;
			$("#container").append("<p>Welcome, " + name + "!</p>");

			//Get Playlists
			R.request({
				method: "getPlaylists",
				content: {},
				success: function(response) {
					console.log(response);
					var ownedPlaylists = response.result.owned;
					for(var i = 0; i < ownedPlaylists.length; i++) {
						var currentPlaylist = ownedPlaylists[i];
						var name = currentPlaylist.name;
						var key = currentPlaylist.key;
						var li = "<li class='playlist' data-key='"
							+ key + "'>"
							+ (i + 1) + ". " +  name + "</li>";
						console.log(li);
						$("#playlists").append(li);
					}
					createClickTogglers();
				},
				error: function(response) {
					console.log("Error: " + response.message);
				}
			});
		});
	}

	function createClickTogglers() {
		$("li").on('click', function(e) {
			e.preventDefault();
			var key = $(this).attr("data-key");
			console.log("Playing playlist: " + key);
			if(!(recognizing)) {
				startRecording();
			}
			R.player.play({source: key});
		})
	}

	$("#recordingToggle").click(function() {
		if(recognizing) {
			stopRecording();
		} else {
			startRecording();
		}
	})

	$("#playPause").click(function(){
		console.log("Toggling play/pause");
		R.player.togglePause();
	})

	function startRecording() {
		finalTranscript = '';
		if(!(recognizing)) {
			recognition.start();
		}
		console.log("If asked, please allow the browser to use your microphone");
	}

	function stopRecording() {
		recognition.stop();
		console.log("Stopped recognition.");
	}
});