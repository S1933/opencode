export const SoundPlugin = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      switch (event.type) {
        // OpenCode attend une confirmation ou une action utilisateur
        case "permission.asked":
          await $`afplay /System/Library/Sounds/Ping.aiff`
          break

        // OpenCode a terminé de répondre et est de nouveau en attente
        case "session.idle":
          await $`afplay /System/Library/Sounds/Glass.aiff`
          break
      }
    },
  }
}
