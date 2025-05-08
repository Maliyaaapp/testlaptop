export  interface ImageSearchParams { 
  search_terms: string;
  width: number;
  height: number;
  number_of_photos?: number;
}

export const getImages = async (params: ImageSearchParams): Promise<string[]> => {
  try {
    const { search_terms, width, height, number_of_photos = 10 } = params;
    
    // In a real app, this would call the Unsplash API via proxy
    // const response = await fetch(`https://hooks.jdoodle.net/proxy?url=https://api.unsplash.com/search/photos?query=${encodeURIComponent(search_terms)}&per_page=${number_of_photos}`, {
    //   method: 'GET',
    //   headers: { 'Authorization': 'Client-ID your_unsplash_access_key' }
    // });
    
    // Fallback images for different searches
    const fallbackImages = {
      'Oman school building architecture': [
        `https://images.unsplash.com/photo-1680181013556-bcd12a4c5d23?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ1NzMwMjIyfDA&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`,
        `https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ1NzMwMjIyfDA&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`,
        `https://images.unsplash.com/photo-1466442929976-97f336a657be?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ1NzMwMjIyfDA&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`,
        `https://images.unsplash.com/photo-1518005020951-eccb494ad742?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ1NzMwMjIyfDA&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`,
        `https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ1NzMwMjIyfDA&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`
      ],
      'school logo education': [
        `https://images.unsplash.com/photo-1577401239170-897942555fb3?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBsb2dvJTIwZWR1Y2F0aW9ufGVufDB8fHx8MTc0NTczMDIyMnww&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`,
        `https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBsb2dvJTIwZWR1Y2F0aW9ufGVufDB8fHx8MTc0NTczMDIyMnww&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`,
        `https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxzY2hvb2wlMjBsb2dvJTIwZWR1Y2F0aW9ufGVufDB8fHx8MTc0NTczMDIyMnww&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`,
        `https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBsb2dvJTIwZWR1Y2F0aW9ufGVufDB8fHx8MTc0NTczMDIyMnww&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`,
        `https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxzY2hvb2wlMjBsb2dvJTIwZWR1Y2F0aW9ufGVufDB8fHx8MTc0NTczMDIyMnww&ixlib=rb-4.0.3&fit=fillmax&h=${height}&w=${width}`
      ]
    };
    
    // Return fallback images based on search terms or a default set
    return fallbackImages[search_terms as keyof typeof fallbackImages] || 
      fallbackImages['Oman school building architecture'];
      
  } catch (error) {
    console.error('Error fetching images from Unsplash:', error);
    return [
      `https://images.unsplash.com/photo-1680181013556-bcd12a4c5d23?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ1NzMwMjIyfDA&ixlib=rb-4.0.3&fit=fillmax&h=${params.height}&w=${params.width}`
    ];
  }
};

export default {
  getImages
};
 