import React, { useRef, useState } from "react";

export default function CreatePost({
    text,
    onAdd,
    onPostChange,
    onImageUpload,
    user,
    isPrivate,
    setIsPrivate,
    showPrivacyToggle = true  // 기본값을 true로 설정
}) {
    const fileInputRef = useRef(null);
    const [previewImages, setPreviewImages] = useState([]);
    const userAvatar = user?.avatar;

    const handleImageUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const imagePreviews = files.map(file => URL.createObjectURL(file));
        setPreviewImages([...previewImages, ...imagePreviews]);
        onImageUpload(e);
    };

    const handleRemoveImage = (indexToRemove) => {
        setPreviewImages(previewImages.filter((_, index) => index !== indexToRemove));
    };

    const handleTogglePrivacy = () => {
        setIsPrivate(!isPrivate); // 공개/비공개 토글
    };

    const handleAddPost = () => {
        onAdd();  // 포스트 추가 로직 실행

        // 포스트가 추가된 후 이미지 프리뷰 초기화
        setPreviewImages([]);
    };

    return (
        <div className="createPostContainer">
            <div className="postHeaderForInputPost">
                <div className="imgContainer">
                    <div className='mx-4'>
                        <img 
                            src={userAvatar || 'default-avatar-url.jpg'}
                            className='w-10 h-10 ring-yellow ring-2 rounded-full' 
                            alt='rounded-avatar'
                        />
                    </div>
                </div>
                <div className="postInput">
                    <input 
                        value={text} 
                        onChange={(e) => onPostChange(e.target.value)} 
                        type="text" 
                        placeholder="What's on your mind?"
                    />
                </div>
            </div>
            <hr className="solid"></hr>
            <div className="imagePreviewContainer">
                {previewImages.map((src, index) => (
                    <div key={index} className="imageWrapper">
                        <img src={src} alt={`Preview ${index}`} className="previewImage" />
                        <button className="removeImageBtn" onClick={() => handleRemoveImage(index)}>X</button>
                    </div>
                ))}
            </div>
            <div className="btnContainer">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="imageUploadInput" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    multiple
                />
                <button className="submitImg" onClick={handleImageUploadClick}>Add Image</button>
                <button className="submitBtn" onClick={handleAddPost}>Post</button>

                {/* showPrivacyToggle이 true일 때만 버튼을 렌더링 */}
                {showPrivacyToggle && (
                    <button className="togglePrivacyBtn" onClick={handleTogglePrivacy}>
                        {isPrivate ? 'Friends Only' : 'Public'}
                    </button>
                )}
            </div>
        </div>
    );
}
