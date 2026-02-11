import React, { useCallback } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { Pressable, ViewStyle } from 'react-native';
import { useEffect } from 'react';

// ─── FadeInView ─────────────────────────────────────────────
interface FadeInViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    translateY?: number;
    style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
    children,
    delay = 0,
    duration = 500,
    translateY = 18,
    style,
}) => {
    const opacity = useSharedValue(0);
    const translate = useSharedValue(translateY);

    useEffect(() => {
        opacity.value = withDelay(
            delay,
            withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
        );
        translate.value = withDelay(
            delay,
            withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translate.value }],
    }));

    return (
        <Animated.View style={[style, animatedStyle]}>
            {children}
        </Animated.View>
    );
};

// ─── ScalePress ─────────────────────────────────────────────
interface ScalePressProps {
    children: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    className?: string;
    style?: ViewStyle;
    scaleValue?: number;
}

export const ScalePress: React.FC<ScalePressProps> = ({
    children,
    onPress,
    disabled,
    className,
    style,
    scaleValue = 0.97,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
    }, [scaleValue]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, []);

    return (
        <Animated.View style={[style, animatedStyle]}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                className={className}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

// ─── SlideInView ────────────────────────────────────────────
type SlideDirection = 'left' | 'right' | 'bottom' | 'top';

interface SlideInViewProps {
    children: React.ReactNode;
    direction?: SlideDirection;
    delay?: number;
    duration?: number;
    distance?: number;
    style?: ViewStyle;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
    children,
    direction = 'bottom',
    delay = 0,
    duration = 450,
    distance = 30,
    style,
}) => {
    const opacity = useSharedValue(0);
    const isHorizontal = direction === 'left' || direction === 'right';
    const initialOffset = direction === 'left' || direction === 'top' ? -distance : distance;
    const offset = useSharedValue(initialOffset);

    useEffect(() => {
        const easing = Easing.out(Easing.cubic);
        opacity.value = withDelay(delay, withTiming(1, { duration, easing }));
        offset.value = withDelay(delay, withTiming(0, { duration, easing }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        if (isHorizontal) {
            return {
                opacity: opacity.value,
                transform: [{ translateX: offset.value }],
            };
        }
        return {
            opacity: opacity.value,
            transform: [{ translateY: offset.value }],
        };
    });

    return (
        <Animated.View style={[style, animatedStyle]}>
            {children}
        </Animated.View>
    );
};

// ─── StaggeredList ──────────────────────────────────────────
interface StaggeredListProps {
    children: React.ReactNode[];
    staggerDelay?: number;
    initialDelay?: number;
    style?: ViewStyle;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
    children,
    staggerDelay = 80,
    initialDelay = 100,
    style,
}) => {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <FadeInView
                    key={index}
                    delay={initialDelay + index * staggerDelay}
                    duration={400}
                    translateY={14}
                    style={style}
                >
                    {child}
                </FadeInView>
            ))}
        </>
    );
};
