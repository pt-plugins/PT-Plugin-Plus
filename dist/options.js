(async () => {
    const exportBtn = document.querySelector('#export_btn')

    // 首先检查是否有 PT-Plugin-Plus-User-Datas
    const storage = await chrome.storage.local.get();
    if (storage['PT-Plugin-Plus-User-Datas']) {
        exportBtn.disabled = false;   // 启用导出按钮

        exportBtn.addEventListener('click', async () => {
          const userDatas = storage['PT-Plugin-Plus-User-Datas'];
            const blob = new Blob([JSON.stringify(userDatas, null, 2)]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'userdatas.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
})();
