def detect_image_type(binary_data):
    if binary_data.startswith(b'\xff\xd8'):
        return 'jpeg'
    elif binary_data.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'png'
    else:
        return None