//Storing the return value of io() allow bidirectional communication between server and client
const socket = io()

const $chatBox = document.querySelector('#chatBox')
const $chatMessages = document.querySelector('#messages')
const $chatBoxButton = document.querySelector('#submit')
const $chatBoxInput = document.querySelector('input')
const $locationButton = document.querySelector('#send-location_button')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = () => {
    // New message element
    const $newMessage = $chatMessages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $chatMessages.offsetHeight

    // Height of messages container
    const containerHeight = $chatMessages.scrollHeight

    // Get how far the user has scrolled
    const scrollOffset = $chatMessages.scrollTop + visibleHeight

    // Check if at the bottom before the new message
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $chatMessages.scrollTop = $chatMessages.scrollHeight
    }
    // TODO: Add button that there is a new message if the user is not at the bottom
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $chatMessages.insertAdjacentHTML('beforeend', html)

    autoscroll()
})

$chatBox.addEventListener('submit', (e) => {
    e.preventDefault()

    $chatBoxButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', e.target.elements.message.value, (error) => {
        $chatBoxButton.removeAttribute('disabled')
        $chatBoxInput.value = ''
        $chatBoxInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('The message was delivered')
    })
})

// Location
socket.on('sendLocation', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        location: message.location,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $chatMessages.insertAdjacentHTML('beforeend', html)
})

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (sharedLocation) => {
            $locationButton.removeAttribute('disabled')
            console.log('The location was delivered')
            console.log(sharedLocation)
        })
    })
})

socket.on('roomDetails', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('joinRoom', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})