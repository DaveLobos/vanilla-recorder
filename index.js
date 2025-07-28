document.addEventListener('DOMContentLoaded', () => {
  let videos = [];

  const sections = {
    list:     document.querySelector('section[data-name="list"]'),
    recorder: document.querySelector('section[data-name="recorder"]'),
    player:   document.querySelector('section[data-name="player"]'),
  };

  const displaySection = (() => {
    const entries = Object.entries(sections);

    return name => {
      entries.forEach(([key, ele]) => {
        if(key !== name){
          ele.removeAttribute("data-current");
        }else{
          ele.setAttribute("data-current", "1");
        }
      });
    };
  })();

  const sectionRecorder = (() => {
    let chunks = [];
    const onData = e => chunks.push(e.data);
    const onStop = () => {
      if(chunks.length > 0){
        videos.push([`My video ${(new Date()).toTimeString().slice(0, 8)}`, new Blob(chunks)]);
        chunks = [];
      }
    };

    const videoTag = sections.recorder.querySelector("video");
    const backButton = sections.recorder.querySelector('[data-action="back"]');
    const recordButton = sections.recorder.querySelector('[data-action="record"]');

    return () => navigator.mediaDevices.getUserMedia({video:true})
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        const cleanUpAndBack = () => {
          videoTag.pause();
          mediaRecorder.stop();
          mediaRecorder.removeEventListener('dataavailable', onData);
          mediaRecorder.removeEventListener('stop', onStop);
          stream.getTracks().forEach(t => t.stop());
          videoTag.srcObject = null;
          backButton.onclick = null;
          recordButton.onclick = null;
          sectionList();
        };

        displaySection("recorder");

        mediaRecorder.addEventListener('dataavailable', onData);
        mediaRecorder.addEventListener('stop', onStop);

        recordButton.onclick = ({target}) => {
          if(mediaRecorder.state === "recording"){
            mediaRecorder.stop();
            target.setAttribute("class", "start");
            target.innerHTML = "start recording";
            alert("Video has been saved.");
            // if(!confirm("Video has been saved.\nContinue recording?")){
            //   cleanUpAndBack();
            // }
          }else{
            mediaRecorder.start();
            target.setAttribute("class", "stop");
            target.innerHTML = "stop recording";
          }
        };

        backButton.onclick = cleanUpAndBack;

        videoTag.muted = true;
        videoTag.srcObject = stream;

        videoTag.play();
      })
      .catch(error => {
        console.log(error);
        alert("Unable to start video stream.");
      });
  })();

  const sectionList = (() => {
    const {list} = sections;
    const ul = list.querySelector("ul");

    ul.addEventListener("click", e => {
      const action = e.target.getAttribute("data-action");

      if(action === "play"){
        sectionPlayer(videos[+(e.target.getAttribute("data-indx"))][1]);
      }else if(action === "download"){
        const [name, blob] = videos[+(e.target.getAttribute("data-indx"))];
        const reader = new FileReader();
        reader.onloadend = () => {
          const a = document.createElement("a");
          a.setAttribute("download", `${name.replace(/[^0-9a-z]/gi, "-")}.mp4`);
          a.setAttribute("href", reader.result);
          a.click();
        };
        reader.readAsDataURL(blob);
      }else if(action === "delete"){
        if(confirm("Delete video?")){
          const indx = +(e.target.getAttribute("data-indx"));
          videos = videos.filter((v, i) => +i !== indx);
          sectionList();
        }
      }
    });

    list.querySelector("button").addEventListener("click", () => sectionRecorder());

    return () => {
      displaySection("list");

      if(videos.length > 0){
        list.removeAttribute("class");
        ul.innerHTML = videos.map((v, i) => (
          `
          <li>
            <span>${i + 1} - ${v[0]}</span>
            <button title="play" data-action="play" data-indx="${i}">play</button>
            <button title="download" data-action="download" data-indx="${i}">download</button>
            <button title="delete" data-action="delete" data-indx="${i}">delete</button>
          </li>
          `
        )).join("");
      }else{
        list.setAttribute("class", "empty");
        ul.innerHTML = "";
      }
    };
  })();

  const sectionPlayer = (() => {
    const videoTag = sections.player.querySelector("video");

    videoTag.addEventListener('loadedmetadata', () => videoTag.play());

    sections.player.querySelector('[data-action="back"]').addEventListener("click", () => {
      videoTag.pause();
      sectionList();
    });

    return blob => {
      displaySection("player");
      videoTag.src = URL.createObjectURL(blob);
    };
  })();

});
