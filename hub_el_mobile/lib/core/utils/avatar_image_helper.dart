import 'dart:convert';
import 'package:flutter/material.dart';
import '../constants/app_environment.dart';

ImageProvider? safeGetImageProvider(String? imageUrl) {
  if (imageUrl == null || imageUrl.isEmpty) return null;
  if (imageUrl.startsWith('data:image')) {
    try {
      final commaIndex = imageUrl.indexOf(',');
      final base64String = commaIndex != -1 ? imageUrl.substring(commaIndex + 1) : imageUrl;
      final bytes = base64Decode(base64String.replaceAll('\n', '').replaceAll('\r', '').trim());
      return MemoryImage(bytes);
    } catch (_) {
      return null;
    }
  } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return NetworkImage(imageUrl);
  } else if (imageUrl.startsWith('/')) {
    return NetworkImage('${AppConfig.baseUrl}$imageUrl');
  }
  return null;
}

Widget buildSafeAvatarImage({
  required String? imageUrl,
  required Widget fallback,
  BoxFit fit = BoxFit.cover,
  double? width,
  double? height,
}) {
  if (imageUrl != null && imageUrl.isNotEmpty) {
    if (imageUrl.startsWith('data:image')) {
      try {
        final commaIndex = imageUrl.indexOf(',');
        final base64String = commaIndex != -1 ? imageUrl.substring(commaIndex + 1) : imageUrl;
        final bytes = base64Decode(base64String.replaceAll('\n', '').replaceAll('\r', '').trim());
        return Image.memory(
          bytes,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (_, _, _) => fallback,
        );
      } catch (_) {
        return fallback;
      }
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return Image.network(
        imageUrl,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, _, _) => fallback,
      );
    } else if (imageUrl.startsWith('/')) {
      final fullUrl = '${AppConfig.baseUrl}$imageUrl';
      return Image.network(
        fullUrl,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, _, _) => fallback,
      );
    }
  }
  return fallback;
}

const Map<String, String> kCardImageHeaders = {
  'User-Agent': 'HubEL/1.0 (https://hub-el.com; contact@hub-el.com) Mozilla/5.0',
};

String? resolveCardImageUrl(String? url) {
  if (url == null || url.trim().isEmpty) return null;
  final trimmed = url.trim();
  if (trimmed.startsWith('/')) {
    return '${AppConfig.baseUrl}$trimmed';
  }
  if (trimmed.contains('/commons/thumb/')) {
    return trimmed.replaceFirst('/commons/thumb/', '/commons/').replaceFirst(RegExp(r'\/[^\/]+$'), '');
  }
  if (trimmed.contains('/en/thumb/')) {
    return trimmed.replaceFirst('/en/thumb/', '/en/').replaceFirst(RegExp(r'\/[^\/]+$'), '');
  }
  return trimmed;
}
