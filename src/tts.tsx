// // Disable for temprory

// import EasySpeech from 'easy-speech';

// EasySpeech.detect();
// EasySpeech.init({ maxTimeout: 5000, interval: 250 })
//   .then(() => MyConsole.debug('load complete'))
//   .catch(e => MyConsole.error(e));

// /* -------------------------------------------------------------------------- */
// /*                                  Functions                                 */
// /* -------------------------------------------------------------------------- */

// async function suggestedVoice(text: string) {
//   const lang = await detectLanguage(texts);
//   info.detectedLang = lang || '';

//   const microsoftVoice = voices.find(
//     voice =>
//       voice.name ===
//         'Microsoft Ana Online (Natural) - English (United States)' ||
//       voice.name === 'en-US-AnaNeural'
//   );
//   if (microsoftVoice) {
//     utterance.voice = microsoftVoice;
//   }
// }
// // const defaultVoiceNames={
// //   'en-US':;
// //   'en-UK':
// // }

// function tts(siteName: string, defaultENVoiceName: string) {
//   const [cell_text, focalcode_text, stdout_text, result_text, stderr_text] =
//     get_focal_data(siteName);

//   MyConsole.log('To be spoke:', focalcode_text);

//   if ('speechSynthesis' in window) {
//     const utterance = new SpeechSynthesisUtterance(focalcode_text);
//     const voices = window.speechSynthesis.getVoices();

//     // MyConsole.log("voices length:", voices.length);

//     // for (let i = 0; i < voices.length; i++) {
//     //   if (voices[i].lang.startsWith("en-US")) {
//     //     MyConsole.log("voice name:", voices[i].name);
//     //   }
//     // }
//     const lang = detectLanguage(focalcode_text);
//     utterance.lang = lang;
//     MyConsole.log('Lang:', lang);

//     let microsoftVoice = voices.find(voice => voice.lang.startsWith(lang));

//     if (lang === 'en') {
//       microsoftVoice = voices.find(voice => voice.name === defaultENVoiceName);
//     } else if (lang === 'zh') {
//       microsoftVoice = voices.find(
//         voice =>
//           voice.name ===
//           'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)'
//       );
//     }

//     if (microsoftVoice) {
//       utterance.voice = microsoftVoice;
//     }

//     MyConsole.log('voice:', utterance.voice || '');

//     window.speechSynthesis.speak(utterance);
//   }
// }

// async function easy_tts(siteName: string, defaultENVoiceName: string) {
//   if (window.speechSynthesis.speaking) {
//     // if (EasySpeech.status().status.includes("speak") ){
//     EasySpeech.cancel();
//   } else {
//     const [cell_text, focalcode_text, stdout_text, result_text, stderr_text] =
//       get_focal_data(siteName);

//     MyConsole.log('To be spoke:', focalcode_text);

//     const voices = EasySpeech.voices();

//     MyConsole.log('easy voices length:', voices.length);

//     // for (let i = 0; i < voices.length; i++) {
//     //   if (voices[i].lang.startsWith("en-US")) {
//     //     MyConsole.log("voice name:", voices[i].name);
//     //   }
//     // }
//     const lang = await browserDetectLanguage(focalcode_text);
//     MyConsole.log('Lang:', lang);

//     let microsoftVoice = voices.find(voice => voice.lang.startsWith(lang));

//     if (lang === 'en') {
//       microsoftVoice = voices.find(voice => voice.name === defaultENVoiceName);
//     } else if (lang === 'zh') {
//       microsoftVoice = voices.find(
//         voice =>
//           voice.name ===
//           'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)'
//       );
//     }

//     await EasySpeech.speak({
//       text: focalcode_text,
//       voice: microsoftVoice, // optional, will use a default or fallback
//       pitch: 1,
//       rate: 1,
//       volume: 1,
//       // there are more events, see the API for supported events
//       boundary: e => MyConsole.debug('boundary reached')
//     });
//   }
// }
