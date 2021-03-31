class Recorder {
    constructor(userName, stream) {
        this.userName = userName
        this.stream = stream

        this.filename = `id:${userName}-when:${Date.now()}`
        this.videoType = 'video/webm'

        this.mediaRecorder = {}
        this.recordedBlobs = []
        this.completeRecording = []
        this.recordingActive = false
    }

    _setup() {
        const commonCodecs = [
            "codecs=vp9,opus",
            "codecs=vp8,opus",
            ""
        ]

        const options = commonCodecs
            .map(codec => ({ mimeType: `${this.videoType};${codec}`}))
            .find(options => MediaRecorder.isTypeSupported(options.mimeType))
        
        if(!options) {
            throw new Error(`none of the codecs: ${commonCodecs.join(',')} are suported`)
        }

        return options
    }

    startRecording() {
        const options = this._setup()
        // se não estiver recebendo mais vídeo, já ignora!
        if(!this.stream.active) return;
        this.mediaRecorder = new MediaRecorder(this.stream, options)
        console.log(`Created MediaRecorder ${this.mediaRecorder} with options ${options}`)

        this.mediaRecorder.onstop = (event) => {
            console.log('Recorded Blobs', this.recordedBlobs)
        }

        this.mediaRecorder.ondataavailable = (event) => {
            if(!event.data || !event.data.size) return;

            this.recordedBlobs.push(event.data)
        }

        this.mediaRecorder.start()
        console.log(`Media Recorded started`, this.mediaRecorder)
        this.recordingActive = true
    }

    async stopRecording() {
        if(!this.recordingActive) return;
        if(this.mediaRecorder.state === "inactive") return;

        console.log('media recorded stopped!', this.userName)
        this.mediaRecorder.stop()

        this.recordingActive = false
        await Util.sleep(200)
        this.completeRecording.push([...this.recordedBlobs])
        this.recordedBlobs = []
    }

    getAllVideoURLs() {
        return this.completeRecording.map(recording => {
            const superBuffer = new Blob(recording, { type: this.videoType })
            
            return window.URL.createObjectURL(superBuffer)
        })
    }

    download() {
        if(!this.completeRecording.length) return;

        for(const recording of this.completeRecording) {
            const blob = new Blob(recording, { type: this.videoType })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = `${this.filename}.webm`
            document.body.appendChild(a)
            a.click()
        }
    }
}