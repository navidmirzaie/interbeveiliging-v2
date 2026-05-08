import { createPinia } from 'pinia'

export default defineNuxtPlugin({
  name: 'pinia',
  enforce: 'pre',
  setup(nuxtApp) {
    const pinia = createPinia()
    nuxtApp.vueApp.use(pinia)

    if (import.meta.server) {
      nuxtApp.hooks.hook('app:rendered', () => {
        nuxtApp.payload.pinia = pinia.state.value
      })
    } else if (nuxtApp.payload.pinia) {
      pinia.state.value = nuxtApp.payload.pinia as typeof pinia.state.value
    }

    return { provide: { pinia } }
  },
})
