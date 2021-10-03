import React from 'react';
import io from 'socket.io-client';
import {decode as base64_decode, encode as base64_encode} from 'base-64';
import './style.css';

class Board extends React.Component {

    timeout;
    //socket = io.connect("http://localhost:3000");
    socket = io.connect("https://collab-whiteboard-backend.herokuapp.com/");

    ctx;
    isDrawing = false;

    constructor(props) {
        super(props);
        
        this.clearAll = this.clearAll.bind(this);
        this.copyAll = this.copyAll.bind(this);
        this.performOCR = this.performOCR.bind(this);
        
        this.socket.on("canvas-data", function(data){

            var root = this;
            var interval = setInterval(function(){
                if(root.isDrawing) return;
                root.isDrawing = true;
                clearInterval(interval);
                var image = new Image();
                var canvas = document.querySelector('#board');
                var ctx = canvas.getContext('2d');
                image.onload = function() {
                    ctx.drawImage(image, 0, 0);

                    root.isDrawing = false;
                };
                image.src = data;
            }, 200)
        })
    }

    clearAll() {
        
        var canvas = document.querySelector('#board');
        this.ctx = canvas.getContext('2d');
        var ctx = this.ctx;

        var sketch = document.querySelector('#sketch');
        var sketch_style = getComputedStyle(sketch);
        canvas.width = parseInt(sketch_style.getPropertyValue('width'));
        canvas.height = parseInt(sketch_style.getPropertyValue('height'));
        ctx.clearRect(0, 0, canvas.width, canvas.height); 

        var base64ImageData = canvas.toDataURL("image/png");
        this.socket.emit("canvas-data", base64ImageData);

        ctx.lineWidth = this.props.size;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = this.props.color;
      }
    
    copyAll() {
        try {
        var canvas = document.querySelector('#board');
        canvas.toBlob(function(blob) { 
            navigator.clipboard.write([
                new window.ClipboardItem({
                  "image/png": blob
                })
              ]);
              console.log('Image copied.');
              alert("Copied to Clipboard");
            
        });
        } catch (err) {
            console.error(err.name, err.message);
          }
    }
    async performOCR(){
        console.log("Perform OCR")
        try {
            var canvas = document.querySelector('#board');
            var img    = canvas.toDataURL("image/png");
            let encoded = base64_encode(img);
            let b64_str = ""
            b64_str = img.replace("data:image/png;base64,","")
            
            console.log(b64_str)
            var data = {"file":b64_str} 
            
            
            const requestOptions = {
                method: 'POST',
                headers: {'Content-Type': 'multipart/form-data','Accept':'*/*','Accept-Encoding':'gzip, deflate, br',
                'Access-Control-Allow-Origin':'*'},
                body: data
            };

            console.log(requestOptions)
            let link = ""
            
            link = "http://6569-35-236-162-218.ngrok.io/ocr"
             
            
            console.log(link)
            let response = await fetch(link, requestOptions)
            console.log(response)
            /*.then(async response => {
                const data = await response.json();
    
                // check for error response
                if (!response.ok) {
                    // get error message from body or default to response statusText
                    const error = (data && data.message) || response.statusText;
                    return Promise.reject(error);
                }
    
                this.setState({ totalReactPackages: data.total })
            })*/
            } catch (err) {
                console.error(err.name, err.message);
            }
    }
    componentDidMount() {
        this.drawOnCanvas();
        //this.performOCR();
    }

    componentWillReceiveProps(newProps) {
        this.ctx.strokeStyle = newProps.color;
        this.ctx.lineWidth = newProps.size;
    }

    drawOnCanvas() {
        var canvas = document.querySelector('#board');
        this.ctx = canvas.getContext('2d');
        var ctx = this.ctx;

        var sketch = document.querySelector('#sketch');
        var sketch_style = getComputedStyle(sketch);
        canvas.width = parseInt(sketch_style.getPropertyValue('width'));
        canvas.height = parseInt(sketch_style.getPropertyValue('height'));

        var mouse = {x: 0, y: 0};
        var last_mouse = {x: 0, y: 0};

        /* Mouse Capturing Work */
        canvas.addEventListener('mousemove', function(e) {
            last_mouse.x = mouse.x;
            last_mouse.y = mouse.y;

            mouse.x = e.pageX - this.offsetLeft;
            mouse.y = e.pageY - this.offsetTop;
        }, false);


        /* Drawing on Paint App */
        ctx.lineWidth = this.props.size;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = this.props.color;

        canvas.addEventListener('mousedown', function(e) {
            canvas.addEventListener('mousemove', onPaint, false);
        }, false);

        canvas.addEventListener('mouseup', function() {
            canvas.removeEventListener('mousemove', onPaint, false);
        }, false);

        var root = this;
        var onPaint = function() {
            ctx.beginPath();
            ctx.moveTo(last_mouse.x, last_mouse.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.closePath();
            ctx.stroke();
            
            if(root.timeout != undefined) clearTimeout(root.timeout);
            root.timeout = setTimeout(function(){
                var base64ImageData = canvas.toDataURL("image/png");
                root.socket.emit("canvas-data", base64ImageData);
            }, 500)
        };
    }

    render() {
        var canimg = this; 
        return (
            <div class="sketch" id="sketch">
                
                <canvas className="board" id="board"></canvas>
                <div className="tools-container">
                    <button type="button" onClick={this.clearAll}>Clear All</button>
                    <button type="button" onClick={this.copyAll}>Copy to Clipboard</button>
                    <button type="button" onClick={this.performOCR}>Perform OCR</button>
                    
                </div>
            </div>
        )
    }
}

export default Board