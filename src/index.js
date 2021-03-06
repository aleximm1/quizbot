var Alexa = require('alexa-sdk');
var request = require('request');
var api = require('./api.js');
var messages = require('./messages');
var questions = require('./questions1');
var helpers = require('./helpers');

var APP_ID = undefined;
var QUESTION_TOTAL = 5;

var correctAnswerMessages = ['Yay!', 'Right answer!','Correct!', 'Woo hoo!', 'Awesome!', 'Great job!', 'Well done!', 'Oh no! Just kidding. Great!',
'Kaching!', 'Way to go!', 'Wowza!', 'Booya!', 'Hurray!', 'Bingo!', 'Hip hip hooray!', 'Bazinga!', 'Whee!', 'Bravo!', 'Cha ching!', 'All righty!'];

var incorrectAnswerMessages = ['Wrong answer!','Incorrect!', 'That is incorrect!', 'Oh boy!', 'Whoops a daisy!', 'Dun dun dun!', 'Argh!', 'Aw!',
'Uh oh!', 'Oh dear!', 'Eek!', 'Ouch!', 'Oh no!'];

var states = {
  TRIVIA: "_TRIVIAMODE",
  MENU: "_MENUMODE"
};

var questionNumber;
var currentQuestion;
var score;
var usedKeys = [];

exports.handler = function(event, context, callback){
  var alexa_one = Alexa.handler(event, context);
  alexa_one.registerHandlers(handlers, menuHandlers, triviaHandlers);
  alexa_one.appId = APP_ID;
  alexa_one.execute();
};

var handlers =  {

  "LaunchRequest": function() {
    var alexa = this;
    this.handler.state = states.MENU;
    alexa.emitWithState('NewSession');
  },

  "UnhandledIntent": function() {
    this.emit(':ask', messages.GENERAL_UNHANDLED_MESSAGE);
  },

  "Unhandled": function() {
    this.emit(':ask', messages.GENERAL_UNHANDLED_MESSAGE);
  }
};

var menuHandlers = Alexa.CreateStateHandler(states.MENU, {

  "NewSession": function () {
    this.emit(':ask', messages.WELCOME_MESSAGE);
  },

  "LevelIntent": function() {
    level = this.event.request.intent.slots.Level.value;
    if (level === '1') {
      questions = require('./questions1');
      levelId = 1;
    } else if (level === '2') {
      questions = require('./questions2');
      levelId = 2;
    } else {
      this.emitWithState('AMAZON.HelpIntent');
    }
    this.emitWithState('AMAZON.StartOverIntent');
  },

  "AMAZON.StartOverIntent": function() {
    var alexa = this;
    questionNumber = 1;
    score = 0;
    this.handler.state = states.TRIVIA;
    usedKeys = [];
    alexa.emitWithState('QuestionIntent', messages.INSTRUCTIONS_MESSAGE);
  },

"AMAZON.HelpIntent": function() {
  this.emit(':ask', messages.MENU_HELP_MESSAGE);
},

"MenuIntent": function(message) {
  var alexa = this;
  var cardTitle = 'Quizbot Results Card';
  var cardContent = 'Your score for this quiz was ' + score + '/' + QUESTION_TOTAL + '.';
  var repromptSpeech = 'To play a new quiz, ' + messages.LEVEL_PROMPT ;

  if (questionNumber > QUESTION_TOTAL) {
    alexa.emit(':askWithCard', message + '!', repromptSpeech, cardTitle, cardContent);
  } else {
    alexa.emit(':ask', messages.MENU_HELP_MESSAGE);
  }
},

"AMAZON.CancelIntent": function() {
  this.emit(':tell', messages.EXIT_MESSAGE);
},

"UnhandledIntent": function() {
  this.emit(':ask', messages.MENU_UNHANDLED_MESSAGE);
},

"Unhandled": function() {
  this.emit(':ask', messages.MENU_UNHANDLED_MESSAGE);
}
});

var triviaHandlers = Alexa.CreateStateHandler(states.TRIVIA, {
  "QuestionIntent": function(lastQuestionResult) {
    currentQuestion = helpers.getQuestion(questions, usedKeys);
    this.emit(':ask', lastQuestionResult + '<break time="0.35s"/> Question ' + questionNumber + '. <break time="0.35s"/>' + currentQuestion);
    questionNumber++;
  },

  "AnswerIntent": function() {
    var guessAnswer = this.event.request.intent.slots.Answer.value;
    var correctAnswer = questions[currentQuestion];
    if (guessAnswer === correctAnswer) {
      score++;
      if (questionNumber > QUESTION_TOTAL) {
        this.handler.state = states.MENU;
        this.emitWithState('MenuIntent', helpers.getAnswerReply(correctAnswerMessages) + '<break time="0.35s"/> You have scored ' + score + ' out of ' + QUESTION_TOTAL);
      } else {
        this.emitWithState('QuestionIntent', helpers.getAnswerReply(correctAnswerMessages));
      }

    } else {
      if (questionNumber > QUESTION_TOTAL) {
        this.handler.state = states.MENU;
        this.emitWithState('MenuIntent', helpers.getAnswerReply(incorrectAnswerMessages) + '<break time="0.35s"/> You have scored ' + score + ' out of ' + QUESTION_TOTAL);
      } else {
        this.emitWithState('QuestionIntent', helpers.getAnswerReply(incorrectAnswerMessages));
      }
    }
  },

  "AMAZON.RepeatIntent": function() {
    this.emit(':ask', currentQuestion);
  },

  "AMAZON.HelpIntent": function() {
    this.emit(':ask', messages.TRIVIA_HELP_MESSAGE);
  },

  "AMAZON.StopIntent": function() {
    this.handler.state = states.MENU;
    this.emitWithState('MenuIntent', "");
  },

  "AMAZON.CancelIntent": function() {
    this.emit(':tell', messages.EXIT_MESSAGE);
  },

  "UnhandledIntent": function() {
    this.emit(':ask', messages.GENERAL_UNHANDLED_MESSAGE);
  },

  "Unhandled": function() {
    this.emit(':ask', messages.GENERAL_UNHANDLED_MESSAGE);
  }

});
