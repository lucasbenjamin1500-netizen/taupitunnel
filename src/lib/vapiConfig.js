const OUTRO_FR =
  "Ce fut un plaisir d'échanger avec vous. N'hésitez pas à revenir me parler si besoin. Bonne fin de voyage avec Eurotunnel !"

const OUTRO_EN =
  'It was a pleasure talking with you. Feel free to come back if you need anything. Enjoy the rest of your journey with Eurotunnel!'

export function getAssistantOverrides(selectedLanguage) {
  const isEn = selectedLanguage === 'en'

  return {
    variableValues: {
      language: isEn ? 'English' : 'French',
    },
    transcriber: {
      provider: 'deepgram',
      language: isEn ? 'en' : 'fr',
    },
    startSpeakingPlan: {
      waitSeconds: 0,
    },
    endCallMessage: isEn ? OUTRO_EN : OUTRO_FR,
    endCallPhrases: isEn
      ? ['Enjoy the rest of your journey with Eurotunnel']
      : ['Bonne fin de voyage avec Eurotunnel'],
    maxDurationSeconds: 300,
    ...(isEn
      ? {
          firstMessage:
            "Hi, I'm Taupitunnel. How was your experience today?",
        }
      : {}),
  }
}
