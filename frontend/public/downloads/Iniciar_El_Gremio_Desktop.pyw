import webview
import sys

def main():
    server_url = "http://192.168.0.200:8083"
    window = webview.create_window(
        title="El Gremio de la Taberna RPG - Aplicación de Escritorio",
        url=server_url,
        width=1366,
        height=868,
        min_size=(1024, 700),
        resizable=True,
        fullscreen=False,
        background_color="#0f0e17"
    )
    webview.start(private_mode=False)

if __name__ == "__main__":
    main()
