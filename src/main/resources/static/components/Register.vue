<template>
  <section class="card">
    <h2>Inscription</h2>
    <p class="subtitle">Crée un compte pour commencer à partager ton calendrier.</p>
    <form @submit.prevent="submit">
      <label>
        Nom
        <input type="text" v-model.trim="form.name" required :disabled="loading">
      </label>
      <label>
        Email
        <input type="email" v-model.trim="form.email" required :disabled="loading">
      </label>
      <label>
        Mot de passe
        <input type="password" v-model="form.password" required :disabled="loading">
      </label>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Création...' : 'Créer un compte' }}
      </button>
    </form>
    <p v-if="message" class="message" :class="{ error: hasError, success: !hasError }">
      {{ message }}
    </p>
  </section>
</template>

<script>
export default {
  name: 'RegisterView',
  data() {
    return {
      form: {
        name: '',
        email: '',
        password: ''
      },
      loading: false,
      message: '',
      hasError: false
    }
  },
  methods: {
    async submit() {
      this.loading = true
      this.message = ''
      this.hasError = false
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        })
        const text = await response.text()
        this.hasError = !response.ok
        this.message = text
        if (response.ok) {
          this.form.name = ''
          this.form.email = ''
          this.form.password = ''
        }
      } catch (error) {
        console.error(error)
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
.card {
  max-width: 420px;
  margin: 0 auto;
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
}

.subtitle {
  margin-bottom: 1.5rem;
  color: #5f6b7c;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  font-weight: 600;
  color: #1f2933;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

input {
  border: 1px solid #d7dfe9;
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  font-size: 1rem;
}

button {
  margin-top: 0.3rem;
  padding: 0.85rem;
  border: none;
  border-radius: 10px;
  background-color: #2563eb;
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
  text-align: center;
}

.message.success {
  color: #1f8c4d;
}

.message.error {
  color: #d93025;
}
</style>
