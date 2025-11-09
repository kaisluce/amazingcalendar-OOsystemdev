<template>
  <div class="login-page">
    <div class="card">
      <h2>Connexion</h2>
      <p class="subtitle">Entre ton email et mot de passe pour accéder à Amazing Calendar.</p>
      <form @submit.prevent="submitLogin">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          v-model.trim="email"
          required
          :disabled="loading"
        />

        <label for="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          v-model="password"
          required
          :disabled="loading"
        />

        <button type="submit" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Connexion' }}
        </button>
      </form>

      <p
        v-if="message"
        class="message"
        :class="{ success: !hasError, error: hasError }"
      >
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      message: '',
      hasError: false
    }
  },
  methods: {
    async submitLogin() {
      this.loading = true
      this.message = ''
      this.hasError = false

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        })

        const text = await response.text()
        this.hasError = !response.ok
        this.message = text
      } catch (error) {
        console.error('Login error', error)
        this.hasError = true
        this.message = 'Une erreur est survenue.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: #f5f7fb;
}

.card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 15px 40px rgba(15, 23, 42, 0.15);
}

.subtitle {
  color: #5f6b7c;
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

label {
  font-weight: 600;
  text-align: left;
  color: #1f2933;
}

input {
  padding: 0.75rem 0.9rem;
  border: 1px solid #d7dfe9;
  border-radius: 10px;
  font-size: 1rem;
}

button {
  margin-top: 0.5rem;
  padding: 0.85rem;
  border-radius: 10px;
  border: none;
  background-color: #42b983;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  font-weight: 600;
}

.message.success {
  color: #1f8c4d;
}

.message.error {
  color: #d93025;
}
</style>
