import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "components/Header";
import axios from "axios";
import {
  ProfileWrapper,
  ProfileImg,
  PostCardsWrapper,
  PostCardborder,
  Nickname,
  MyPost,
} from "./MyPage.style";
import PostCard from "components/PostCard";
import { userProfileState } from "Atoms";
import { useRecoilValue } from "recoil";

export function MyPage() {
  const userProfile = useRecoilValue(userProfileState);
  const [currentClick, setCurrentClick] = useState("MyPosts");
  const [prevClick, setPrevClick] = useState(null);
  const [posts, setPosts] = useState("");
  const [page, setPageNum] = useState(1);
  const intersectionRef = useRef(null);

  const GetClick = e => {
    setCurrentClick(e.target.id);
    // console.log(e.target.id);
  };

  const getMyPost = async page => {
    const url = "/api/users/post/";
    const response = await axios.get(url, {
      params: {
        page: page,
        userId: userProfile.id,
      },
    });
    setPosts(prev => {
      const newPosts = [...prev, ...response.data.posts];
      return newPosts;
    });
  };

  useEffect(
    e => {
      currentClick === "MyPosts" ? getMyPost() : console.log("LikedPosts");
      if (currentClick !== null) {
        let current = document.getElementById(currentClick);
        console.log(current);
        current.style.color = "var(--primary)";
        current.style.boxShadow = "0px 4px 0px var(--primary)";
      }

      if (prevClick !== null) {
        let prev = document.getElementById(prevClick);
        prev.style.color = "#000000";
        prev.style.boxShadow = "none";
      }
      setPrevClick(currentClick);
    },
    [currentClick],
  );

  const options = {
    root: null, // 관찰대상의 부모요소
    rootMargin: "300px", // 뷰포트의 마진
    threshold: 1, // 0 ~ 1 겹치는 정도
  };

  const handleObserver = useCallback(async entires => {
    const target = entires[0];
    if (target.isIntersecting) {
      setPageNum(prev => prev + 1);
    }
    return;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, options);
    if (intersectionRef.current) {
      observer.observe(intersectionRef.current);
    }
    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    getMyPost(page);
  }, [page]);

  return (
    <ProfileWrapper>
      <Header />

      <ProfileImg>
        <img src="/img/profile2.png" />
      </ProfileImg>
      <Nickname>{userProfile.name}</Nickname>
      <MyPost>
        <ul>
          <li>
            <button id="MyPosts" onClick={GetClick}>
              내가 작성한 글
            </button>
          </li>
          <li>
            <button id="LikePosts" onClick={GetClick}>
              좋아요 한 글
            </button>
          </li>
        </ul>
      </MyPost>
      <PostCardborder />

      <PostCardsWrapper>
        {console.log(posts.author)}
        {posts &&
          posts.map(({ id, title, imgUrl, likes, author }, index) => {
            return (
              <PostCard
                key={index}
                id={id}
                imgUrl={imgUrl}
                title={title}
                author={author}
                likes={likes}
              />
            );
          })}
        <div ref={intersectionRef} style={{ position: "hidden" }}></div>
      </PostCardsWrapper>
    </ProfileWrapper>
  );
}