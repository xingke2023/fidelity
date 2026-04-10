/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Typography,
  Input,
  ScrollList,
  ScrollItem,
} from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
  IconFile,
  IconCopy,
} from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
} from '@lobehub/icons';

const { Text } = Typography;

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const endpointItems = API_ENDPOINTS.map((e) => ({ value: e }));
  const [endpointIndex, setEndpointIndex] = useState(0);
  const isChinese = i18n.language.startsWith('zh');

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // 如果内容是 URL，则发送主题模式
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      showSuccess(t('已复制到剪切板'));
    }
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full overflow-x-hidden'>
          {/* Hero：左右两栏，单屏显示 */}
          <div className='w-full border-b border-semi-color-border min-h-[calc(100vh-60px)] relative overflow-x-hidden flex items-center'>
            {/* 背景模糊晕染球 */}
            <div className='blur-ball blur-ball-indigo' />
            <div className='blur-ball blur-ball-teal' />

            <div className='w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-12 md:pt-12 md:pb-16 flex flex-col gap-10'>

              {/* 上半区：左右两栏 */}
              <div className='flex flex-col lg:flex-row items-center gap-6 lg:gap-8'>

              {/* 左列：主内容 */}
              <div className='flex-1 flex flex-col items-center lg:items-start text-center lg:text-left'>
                <div className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-semi-color-text-0 leading-tight ${isChinese ? 'tracking-wide md:tracking-wider' : ''}`}>
                  {t('统一的')}
                </div>

                <div className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight ${isChinese ? 'tracking-wide md:tracking-wider' : ''}`}>
                  <span className='shine-text'>{t('大模型接口网关')}</span>
                </div>

                <p className='text-base md:text-lg text-semi-color-text-1 mt-4 md:mt-6 max-w-md'>
                  {t('更好的价格，更好的稳定性，只需要将模型基址替换为：')}
                </p>

                {/* BASE URL */}
                <div className='w-full mt-4 md:mt-6 max-w-md'>
                  <Input
                    readonly
                    value={serverAddress}
                    className='flex-1 !rounded-full'
                    size={isMobile ? 'default' : 'large'}
                    suffix={
                      <div className='flex items-center gap-2'>
                        <ScrollList
                          bodyHeight={32}
                          style={{ border: 'unset', boxShadow: 'unset' }}
                        >
                          <ScrollItem
                            mode='wheel'
                            cycled={true}
                            list={endpointItems}
                            selectedIndex={endpointIndex}
                            onSelect={({ index }) => setEndpointIndex(index)}
                          />
                        </ScrollList>
                        <Button
                          type='primary'
                          onClick={handleCopyBaseURL}
                          icon={<IconCopy />}
                          className='!rounded-full'
                        />
                      </div>
                    }
                  />
                </div>

                {/* 操作按钮 */}
                <div className='flex flex-row gap-4 justify-center lg:justify-start items-center mt-6'>
                  <Link to='/console'>
                    <Button
                      theme='solid'
                      type='primary'
                      size={isMobile ? 'default' : 'large'}
                      className='!rounded-3xl px-8 py-2'
                      icon={<IconPlay />}
                    >
                      {t('获取密钥')}
                    </Button>
                  </Link>
                  {isDemoSiteMode && statusState?.status?.version ? (
                    <Button
                      size={isMobile ? 'default' : 'large'}
                      className='flex items-center !rounded-3xl px-6 py-2'
                      icon={<IconGithubLogo />}
                      onClick={() =>
                        window.open(
                          'https://github.com/QuantumNous/new-api',
                          '_blank',
                        )
                      }
                    >
                      {statusState.status.version}
                    </Button>
                  ) : (
                    docsLink && (
                      <Button
                        size={isMobile ? 'default' : 'large'}
                        className='flex items-center !rounded-3xl px-6 py-2'
                        icon={<IconFile />}
                        onClick={() => window.open(docsLink, '_blank')}
                      >
                        {t('文档')}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* 右列：Seedance 广告卡（视频背景） */}
              <div className='w-full lg:w-[460px] xl:w-[520px] flex-shrink-0 seedance-ad-section'>
                <a
                  href='https://demo1.xingke888.com/video'
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div className='seedance-card' style={{ padding: 0, overflow: 'hidden', minHeight: '420px' }}>
                    {/* 视频背景 */}
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, borderRadius: '24px' }}
                      src='https://ark-common-storage-prod-cn-beijing.tos-cn-beijing.volces.com/presets/experience/gen_video/model-promotion/seedance-2-0/firstScreen/group4/output.mp4'
                    />
                    {/* 遮罩：底部渐变，确保文字可读 */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to top, rgba(10,8,30,0.92) 0%, rgba(10,8,30,0.4) 50%, rgba(10,8,30,0.1) 100%)', borderRadius: '24px' }} />
                    {/* 顶部角标 */}
                    <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
                      <span className='seedance-tag'>FidelityAI 最新接入</span>
                    </div>
                    {/* 底部文案 */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: '28px 28px 24px' }}>
                      <h2 className='text-2xl md:text-3xl font-bold text-white mb-1 leading-tight'>
                        <span className='seedance-shimmer-text'>Seedance 2.0</span>
                      </h2>
                      <p className='text-sm font-medium mb-3' style={{ color: 'rgba(255,255,255,0.75)' }}>
                        AI 视频制作工具 · 豆包最新一代视频生成模型
                      </p>
                      <div className='flex gap-4 mb-4 flex-wrap'>
                        <div className='seedance-feature-item'>
                          <div className='seedance-feature-dot' /><span>极速生成</span>
                        </div>
                        <div className='seedance-feature-item'>
                          <div className='seedance-feature-dot' /><span>文生 / 图生视频</span>
                        </div>
                        <div className='seedance-feature-item'>
                          <div className='seedance-feature-dot' /><span>超高画质</span>
                        </div>
                      </div>
                      <span className='seedance-cta' style={{ fontSize: '14px', padding: '10px 24px' }}>
                        立即体验 →
                      </span>
                    </div>
                  </div>
                </a>
              </div>

              </div>{/* end 上半区 */}

              {/* 下半区：供应商图标横跨全宽 */}
              <div className='w-full pt-4 border-t border-semi-color-border border-opacity-30'>
                <Text type='tertiary' className='text-xs font-light block mb-3 text-center'>
                  {t('支持众多的大模型供应商')}
                </Text>
                <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5'>
                  {[
                    <Moonshot size={26} />, <OpenAI size={26} />, <XAI size={26} />,
                    <Zhipu.Color size={26} />, <Volcengine.Color size={26} />, <Cohere.Color size={26} />,
                    <Claude.Color size={26} />, <Gemini.Color size={26} />, <Suno size={26} />,
                    <Minimax.Color size={26} />, <Wenxin.Color size={26} />, <Spark.Color size={26} />,
                    <DeepSeek.Color size={26} />, <Qwen.Color size={26} />, <Midjourney size={26} />,
                    <Grok size={26} />, <AzureAI.Color size={26} />, <Hunyuan.Color size={26} />,
                    <Xinference.Color size={26} />,
                  ].map((icon, i) => (
                    <div key={i} className='w-7 h-7 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity'>
                      {icon}
                    </div>
                  ))}
                  <Typography.Text className='!text-sm font-bold opacity-50'>30+</Typography.Text>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
