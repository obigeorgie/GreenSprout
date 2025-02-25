import gradio as gr
import numpy as np
from PIL import Image

def classify_plant(image):
    """
    Placeholder for plant classification.
    In a production environment, this would use a trained model.
    """
    # Convert to PIL Image if needed
    if isinstance(image, np.ndarray):
        image = Image.fromarray(image)
    
    # Placeholder classification
    # This should be replaced with actual model inference
    mock_results = {
        "Monstera Deliciosa": 0.8,
        "Snake Plant": 0.6,
        "Pothos": 0.4,
        "Spider Plant": 0.3,
        "Peace Lily": 0.2,
    }
    
    return mock_results

# Create Gradio interface
interface = gr.Interface(
    fn=classify_plant,
    inputs=gr.Image(),
    outputs=gr.Label(num_top_classes=5),
    title="Plant Species Identification",
    description="Upload a photo of a plant to identify its species",
)

# Only launch the interface if running this file directly
if __name__ == "__main__":
    interface.launch(server_name="0.0.0.0", server_port=7860)
