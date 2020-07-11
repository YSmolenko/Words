var stompClient = null;
var interval = null;

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#start").prop("disabled", false);
}

function connect() {
    var socket = new SockJS('/gs-guide-websocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        setConnected(true);
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/greetings', function (greeting) {
            showGreeting(JSON.parse(greeting.body).content);
            restartEnable();
        });
        stompClient.subscribe('/topic/block', function (greeting) {
            block();
        });
        stompClient.subscribe('/topic/unblock', function (greeting) {
            unblock();
        });
        stompClient.subscribe('/topic/restart', function (greeting) {
            newGame();
        });
        stompClient.subscribe('/topic/next', function (greeting) {
            next();
        });
    });
}

function block() {
    if (interval) {
        clearInterval(interval);
    }
    console.log("block")
    $("#start").prop("disabled", true);
    $("#word").text("Ход другого игрока");
    startTimer();
}

function unblock() {
    removeTimer();
    $("#start").prop("disabled", false);
}

function sendCorrect() {
    stompClient.send("/app/hello", {}, JSON.stringify({'name': "correct"}));
}

function sendIncorrect() {
    stompClient.send("/app/hello", {}, JSON.stringify({'name': "incorrect"}));
}

function showGreeting(message) {
    $("#word").text(message);
}

function next() {
    removeTimer();
    $("#start").prop("disabled", false);
    $("#correct").prop("disabled", true);
    $("#incorrect").prop("disabled", true);
    $("#word").text("Следующий игрок");
}

function start() {
    stompClient.subscribe('/user/queue/words', function (greeting) {
        showGreeting(JSON.parse(greeting.body).content);
    });
    stompClient.send("/app/hello", {}, JSON.stringify({'name': "start"}));
    $("#start").prop("disabled", true);
    $("#correct").prop("disabled", false);
    $("#incorrect").prop("disabled", false);
}

function restartEnable() {
    removeTimer();
    $("#correct").prop("disabled", true);
    $("#incorrect").prop("disabled", true);
    $("#restart").prop("disabled", false);
}

function restart() {
    removeTimer();
    stompClient.send("/app/hello", {}, JSON.stringify({'name': "restart"}));
}

function newGame() {
    $("#restart").prop("disabled", true);
    $("#start").prop("disabled", false);
    $("#correct").prop("disabled", true);
    $("#incorrect").prop("disabled", true);
    $("#word").text("Words");
}

$(function () {
    $("#restart").prop("disabled", true);
    $("#start").prop("disabled", true);
    $("#correct").prop("disabled", true);
    $("#incorrect").prop("disabled", true);
    $("#timer").hide();
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect(); });
    $( "#incorrect" ).click(function() { sendIncorrect(); });
    $( "#correct" ).click(function() { sendCorrect(); });
    $( "#start" ).click(function() { start(); });
    $( "#restart" ).click(function() { restart(); });
});

function startTimer() {
    var timer = 60, seconds;
    interval = setInterval(function () {
        seconds = parseInt(timer % 60, 10);
        seconds = seconds < 10 ? "0" + seconds : seconds;
        $("#timer").text(seconds + "s");
        if (--timer < 0) {
            removeTimer();
        }
    }, 1000);
    $("#timer").show()
}

function removeTimer() {
    $("#timer").hide();
    if (interval) {
        clearInterval(interval);
    }
}