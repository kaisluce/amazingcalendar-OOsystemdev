import { loadModule } from 'https://unpkg.com/vue3-sfc-loader/dist/vue3-sfc-loader.esm.js'

const { createApp } = Vue
const { createRouter, createWebHistory } = VueRouter

const options = {
  moduleCache: {
    vue: Vue
  },
  async getFile(url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw Object.assign(new Error('Failed to fetch ' + url), { response })
    }
    return await response.text()
  },
  addStyle(styleStr) {
    const style = document.createElement('style')
    style.textContent = styleStr
    document.head.append(style)
  }
}

const Login = Vue.defineAsyncComponent(() => loadModule('/components/Login.vue', options))
const Register = Vue.defineAsyncComponent(() => loadModule('/components/Register.vue', options))

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/register',
    component: Register
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp({})
app.use(router)
app.mount('#app')
