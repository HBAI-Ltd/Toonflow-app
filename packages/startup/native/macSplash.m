#import <AppKit/AppKit.h>
#import <QuartzCore/QuartzCore.h>
#include <math.h>

@interface startupWindow : NSObject <NSWindowDelegate>
@property(nonatomic, strong) NSWindow *window;
@property(nonatomic) uint32_t width;
@property(nonatomic) uint32_t height;
@property(nonatomic) BOOL didShow;
@property(nonatomic) BOOL isClosed;
@end

@implementation startupWindow
- (void)windowWillClose:(NSNotification *)notification {
    (void)notification;
    self.isClosed = YES;
}
@end

static void onMain(void (^action)(void)) {
    // Electrobun 的 Bun 在工作线程，AppKit 事件循环由宿主主线程持有。
    void (^run)(void) = ^{ @autoreleasepool { action(); } };
    if ([NSThread isMainThread]) run();
    else dispatch_sync(dispatch_get_main_queue(), run);
}

void *createNativeSplash(uint32_t *size) {
    if (!size) return NULL;
    __block void *handle = NULL;
    onMain(^{
        NSScreen *screen = NSScreen.mainScreen;
        if (!screen) return;
        // 显示 Dock 图标；Dock 的“退出”沿用 Electrobun 的 NSApplication delegate。
        [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
        startupWindow *state = [startupWindow new];
        state.width = (uint32_t)llround(400 * screen.backingScaleFactor);
        state.height = (uint32_t)llround(160 * screen.backingScaleFactor);
        if (!state.width || !state.height || state.width > 4096 || state.height > 4096) return;
        state.window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 400, 160)
            styleMask:NSWindowStyleMaskBorderless backing:NSBackingStoreBuffered defer:NO];
        if (!state.window) return;
        state.window.releasedWhenClosed = NO;
        state.window.delegate = state;
        state.window.backgroundColor = NSColor.clearColor;
        state.window.opaque = NO;
        state.window.hasShadow = NO;
        state.window.level = NSFloatingWindowLevel;
        state.window.collectionBehavior = NSWindowCollectionBehaviorTransient | NSWindowCollectionBehaviorMoveToActiveSpace;
        // 先指定 layer 再启用，使用 layer-hosting，避免 AppKit 的空白重绘覆盖动画。
        state.window.contentView.layer = [CALayer layer];
        state.window.contentView.wantsLayer = YES;
        state.window.contentView.layer.opaque = NO;
        state.window.contentView.layer.contentsScale = screen.backingScaleFactor;
        NSRect screenFrame = screen.visibleFrame;
        [state.window setFrameOrigin:NSMakePoint(NSMidX(screenFrame) - 200, NSMidY(screenFrame) - 80)];
        size[0] = state.width;
        size[1] = state.height;
        handle = (__bridge_retained void *)state;
    });
    return handle;
}

int32_t presentNativeSplash(void *handle, const uint8_t *pixels) {
    if (!handle || !pixels) return -1;
    __block int32_t result = -1;
    onMain(^{
        startupWindow *state = (__bridge startupWindow *)handle;
        if (state.isClosed) { result = 1; return; }
        // Core Animation 会异步合成；快照拥有像素，避免 Bun 绘制下一帧时改写当前帧。
        CFDataRef data = CFDataCreate(kCFAllocatorDefault, pixels, (CFIndex)state.width * state.height * 4);
        CGDataProviderRef provider = data ? CGDataProviderCreateWithCFData(data) : NULL;
        CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
        CGImageRef image = provider && colorSpace ? CGImageCreate(state.width, state.height, 8, 32, state.width * 4,
            colorSpace, kCGBitmapByteOrder32Little | kCGImageAlphaPremultipliedFirst, provider, NULL, false, kCGRenderingIntentDefault) : NULL;
        if (image) {
            [CATransaction begin];
            [CATransaction setDisableActions:YES];
            state.window.contentView.layer.contents = (__bridge id)image;
            [CATransaction commit];
            if (!state.didShow) {
                [state.window orderFrontRegardless];
                state.didShow = YES;
            }
            [CATransaction flush];
            result = 0;
        }
        if (image) CGImageRelease(image);
        if (colorSpace) CGColorSpaceRelease(colorSpace);
        if (provider) CGDataProviderRelease(provider);
        if (data) CFRelease(data);
    });
    return result;
}

void closeNativeSplash(void *handle) {
    if (!handle) return;
    onMain(^{
        startupWindow *state = CFBridgingRelease(handle);
        state.window.delegate = nil;
        state.window.contentView.layer.contents = nil;
        [state.window close];
    });
}
