
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const UploadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="container mx-auto flex items-center">
          <Link to="/landing" className="flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Landing
          </Link>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">
            Image Asset Status
          </h1>
          
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-lg p-4 bg-blue-50/50">
              <div className="flex items-start md:items-center flex-col md:flex-row md:justify-between">
                <div className="flex items-center mb-3 md:mb-0">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-slate-800">Open Graph Images</h3>
                    <p className="text-sm text-slate-600">Social media preview images</p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-md shadow-sm mb-1 overflow-hidden">
                      <img 
                        src="/og-image-1200x630.png" 
                        alt="1200x630 Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-slate-500">1200x630</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-md shadow-sm mb-1 overflow-hidden">
                      <img 
                        src="/og-image-1080x1080.png" 
                        alt="1080x1080 Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-slate-500">1080x1080</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-4 bg-blue-50/50">
              <div className="flex items-start md:items-center flex-col md:flex-row md:justify-between">
                <div className="flex items-center mb-3 md:mb-0">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-slate-800">Favicon Images</h3>
                    <p className="text-sm text-slate-600">Browser tab icons</p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-white rounded-md shadow-sm mb-1 overflow-hidden p-1">
                      <img 
                        src="/favicon.ico" 
                        alt="Favicon" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-slate-500">favicon</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-white rounded-md shadow-sm mb-1 overflow-hidden p-1">
                      <img 
                        src="/favicon-32x32.png" 
                        alt="32x32 Favicon" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-slate-500">32x32</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-white rounded-md shadow-sm mb-1 overflow-hidden p-1">
                      <img 
                        src="/favicon-16x16.png" 
                        alt="16x16 Favicon" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-slate-500">16x16</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-white rounded-md shadow-sm mb-1 overflow-hidden p-1">
                      <img 
                        src="/apple-touch-icon.png" 
                        alt="Apple Touch Icon" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-slate-500">Apple</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-slate-600 mb-4">
              All image assets have been successfully configured for your application.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/landing">Return to Landing Page</Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default UploadPage;
