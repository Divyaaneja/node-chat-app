
const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username,room} = Qs.parse(location.search, { ignoreQueryPrefix:true })

const autoscroll = ()=>{
    //New message element
    const  $newMessage = $messages.lastElementChild
    
    // height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //container height
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if( containerHeight - newMessageHeight <= scrollOffset ){
        $messages.scrollTop = $messages.scrollHeight
    }

}


//connection from client side(user side)
socket.on('connect', ()=>{
    console.log('Connection from user side');
})


socket.on('message', (msg)=>{
    console.log( msg )
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on('locationMessage',(msg)=>{
    console.log(msg)
    const html = Mustache.render(locationTemplate,{
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit' ,(e)=>{
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled','disabled')
    
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()

        if( error ){
            return console.log(error)
        }

        console.log('Delivered!')
    })

})

$locationButton.addEventListener('click',()=>{
    if( !navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }
    $locationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{
           $locationButton.removeAttribute('disabled')
            console.log('Location shared! ')
        })
    })
})


socket.emit('join', {username,room}, (error )=>{
    if( error ){
        alert(error)
        location.href='/'
    }
})


