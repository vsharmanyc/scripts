(() => {
    const pathName = location.pathname.match(/\/u\/\d\//)?.[0] || '/';
    const albumsURL= `https://photos.google.com${pathName}albums`;

    const createElement = (tag, styles) => {
        const element = document.createElement(tag);
        for (const style in styles) element.style[style] = styles[style];
        return element;
    }
    const iframeContainer = createElement('div', {position: 'absolute', 'zIndex': '99999', height: '100vh', width: '100vw' });
    const iframe = createElement('iframe', {height: '80vh', width: '100vw' });
    iframeContainer.append(iframe);
    const statusDiv = createElement('div', {position: 'absolute', bottom: '0', height: '20vh', width: '100vw', background: 'white', textAlign: 'center', 'fontSize': 'large' });
    statusDiv.innerText = 'Click Upload'
    iframeContainer.append(statusDiv);

    // Function to simulate a file drag-and-drop event
    const simulateFileDrop = (files) => {
        const target = Array.from(iframe.contentDocument.body.children).find(e => e.tagName === 'DIV' && e.__jsaction);

        // Create a DataTransfer object
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));

        // Dispatch the dragenter event
        const dragEnterEvent = new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        target.dispatchEvent(dragEnterEvent);

        // Dispatch the dragover event
        const dragOverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        target.dispatchEvent(dragOverEvent);

        // Dispatch the drop event
        const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        target.dispatchEvent(dropEvent);

        console.log('File drag-and-drop simulated!');
    }

    const createAlbumMapping = (files) => {
        const albums = {};
        files.forEach(file => {
            if (file.type === 'image/png' || file.type === 'image/jpeg') {
                const albumName = file.webkitRelativePath.split('/')[1];
                if (!albums[albumName]) {
                    albums[albumName] = [];
                }
                albums[albumName].push(file);
            }
        });
        return albums;
    }

    const getElement = (query) => new Promise((resolve) => {
        const interval = setInterval(() => {
            const element = iframe.contentDocument.querySelector(query);
            if (element) {
                clearInterval(interval);
                resolve(element);
            }
        }, 200)
    })

    const uploadComplete = () => new Promise(async (resolve) => {
        getElement('div[aria-live="polite"] button').then(processBtn => {
            const interval = setInterval(() => {
                processBtn = iframe.contentDocument.querySelector('div[aria-live="polite"] button');
                if (processBtn.innerText.toLowerCase() === 'done') {
                    clearInterval(interval);
                    processBtn.click();
                    resolve();
                }
            }, 200)
        })
    })

    const createAlbum = async (albumName) => {
        (await getElement('button[aria-label="Create album"]')).click();
        const textArea = await getElement('c-wiz[style=""] textarea[aria-label="Edit album name"]');
        textArea.value = albumName;
    }

    const uploadFolderFiles = async (files) => {
        const albums = createAlbumMapping(files);
        const albumsCount = Object.keys(albums).length;
        let i = 1;
        for (const albumName in albums) {
            statusDiv.innerText = `Uploading Album ${i++} of ${albumsCount}  |  ${albumName}`;
            await createAlbum(albumName);
            simulateFileDrop(albums[albumName]);
            await uploadComplete();
            (await getElement('a[aria-label="Back"]')).click();
        }
        statusDiv.innerText = `All ${albumsCount} albums have been uploaded. Please verify`;
        iframe.contentDocument.location.reload();
    }

    const selectFolders = () => {
        const fileInput = document.createElement('input');
        fileInput.multiple = true;
        fileInput.webkitdirectory = true;
        fileInput.type = 'file';
        fileInput.click();
        fileInput.onchange = () => uploadFolderFiles(Array.from(fileInput.files));
    }

    iframe.id = 'frame for folders to albums uploads';
    iframe.src = albumsURL;
    const headContent = document.head.innerHTML;
    const bodyContent = document.body.innerHTML;
    document.body.prepend(iframeContainer);
    if (iframe.contentWindow.trustedTypes && iframe.contentWindow.trustedTypes.createPolicy) {
        iframe.contentWindow.trustedTypes.createPolicy('default', {
        createHTML: (string, sink) => string
        });
    }
    iframe.contentDocument.head.innerHTML = headContent;
    iframe.contentDocument.body.innerHTML = bodyContent;
    iframe.contentDocument = iframe.contentDocument;
    selectFolders();
})();