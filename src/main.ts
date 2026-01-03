import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
      <h1 class="text-4xl font-bold text-gray-800 mb-4 text-center">Chat Message Simulator</h1>
      <p class="text-gray-600 text-center mb-6">Web-based tool for creating realistic chat conversations</p>
      <div class="flex gap-4 justify-center">
        <span class="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors">Vite</span>
        <span class="px-4 py-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 transition-colors">Tailwind CSS</span>
        <span class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">TypeScript</span>
      </div>
    </div>
  </div>
`
