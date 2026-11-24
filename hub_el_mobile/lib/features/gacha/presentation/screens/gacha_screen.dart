import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/repositories/gacha_repository.dart';
import '../../domain/usecases/exchange_card_usecase.dart';
import '../../domain/usecases/get_exchange_cards_usecase.dart';
import '../../domain/usecases/get_gacha_history_usecase.dart';
import '../../domain/usecases/get_gacha_status_usecase.dart';
import '../../domain/usecases/roll_gacha_usecase.dart';
import '../bloc/gacha_bloc.dart';
import '../bloc/gacha_event.dart';
import '../bloc/gacha_state.dart';
import '../widgets/gacha_card_frame_widget.dart';
import '../widgets/gacha_spinning_card_widget.dart';
import '../widgets/gacha_exchange_modal.dart';
import '../widgets/gacha_header_widget.dart';
import '../widgets/gacha_history_modal.dart';
import '../widgets/gacha_info_modal.dart';
import '../widgets/gacha_result_view.dart';
import '../widgets/gacha_roll_button.dart';
import '../widgets/gacha_sacred_tree_widget.dart';
import '../../../wiki/presentation/bloc/wiki_manager_bloc.dart';
import '../../../wiki/presentation/bloc/wiki_manager_event.dart';
import '../../../wiki/presentation/screens/wiki_manager_screen.dart';

class GachaScreen extends StatelessWidget {
  final bool showBackButton;

  const GachaScreen({super.key, this.showBackButton = true});

  @override
  Widget build(BuildContext context) {
    final gachaRepo = context.read<IGachaRepository>();

    return BlocProvider<GachaBloc>(
      create: (ctx) => GachaBloc(
        getGachaStatusUseCase: GetGachaStatusUseCase(gachaRepo),
        rollGachaUseCase: RollGachaUseCase(gachaRepo),
        getExchangeCardsUseCase: GetExchangeCardsUseCase(gachaRepo),
        exchangeCardUseCase: ExchangeCardUseCase(gachaRepo),
        getGachaHistoryUseCase: GetGachaHistoryUseCase(gachaRepo),
      )..add(const GachaStatusFetchRequested()),
      child: _GachaScreenView(showBackButton: showBackButton),
    );
  }
}

class _GachaScreenView extends StatelessWidget {
  final bool showBackButton;

  const _GachaScreenView({required this.showBackButton});

  void _navigateToWikiInventory(BuildContext context) {
    // Kích hoạt làm mới inventory khi vào Wiki Manager
    context.read<WikiManagerBloc>().add(const WikiInventoryRefreshRequested());
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const WikiManagerScreen(showAppBar: true),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1120),
      body: SafeArea(
        child: BlocConsumer<GachaBloc, GachaState>(
          listener: (context, state) {
            if (state is GachaLoaded && state.errorMessage != null) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.errorMessage!),
                  backgroundColor: const Color(0xFFEF4444),
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is GachaLoading || state is GachaInitial) {
              return const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Color(0xFF38BDF8)),
                    SizedBox(height: 16),
                    Text(
                      'Đang kết nối Cây Tri Thức...',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                  ],
                ),
              );
            }

            if (state is GachaError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.alertTriangle, color: Color(0xFFEF4444), size: 48),
                      const SizedBox(height: 16),
                      Text(
                        state.message,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontSize: 16),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () {
                          context.read<GachaBloc>().add(const GachaStatusFetchRequested());
                        },
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                ),
              );
            }

            final gachaState = state as GachaLoaded;
            final isDrawing = gachaState.rollState == GachaAnimationState.drawing;
            final isSpinning = gachaState.rollState == GachaAnimationState.spinning;
            final isRevealed = gachaState.rollState == GachaAnimationState.revealed;

            return Stack(
              children: [
                // 1. Background Cây Thần và Bụi Sao
                Positioned.fill(
                  child: GachaSacredTreeWidget(isRolling: gachaState.isRolling),
                ),

                // 2. Header Status & Pity Bars
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: Column(
                    children: [
                      if (showBackButton)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          color: const Color(0xFF0F172A).withValues(alpha: 0.8),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
                                onPressed: () => Navigator.of(context).pop(),
                              ),
                              const Text(
                                'CẦU NGUYỆN TRI THỨC',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ],
                          ),
                        ),
                      GachaHeaderWidget(
                        status: gachaState.status,
                        onOpenWikiInventory: () => _navigateToWikiInventory(context),
                      ),
                    ],
                  ),
                ),

                // 3. Vùng hiệu ứng Animation (Drawing / Spinning)
                if (isDrawing || isSpinning)
                  Positioned.fill(
                    child: Container(
                      color: Colors.black.withValues(alpha: 0.6),
                      child: Center(
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(gachaState.rollCount, (index) {
                              final scale = gachaState.rollCount > 1 ? 0.70 : 1.0;
                              return Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                child: isDrawing
                                    ? GachaCardFrameWidget(scale: scale)
                                    : GachaSpinningCardWidget(scale: scale),
                              );
                            }),
                          ),
                        ),
                      ),
                    ),
                  ),

                // 4. Màn hình Kết quả (Revealed)
                if (isRevealed && gachaState.rollResult != null)
                  Positioned.fill(
                    child: GachaResultView(
                      cards: gachaState.rollResult!.cards,
                      bannerMessage: gachaState.bannerMessage,
                      onClose: () {
                        context.read<GachaBloc>().add(const GachaResetResultRequested());
                      },
                    ),
                  ),

                // 5. Thanh công cụ phía dưới (Tiệm đổi, Chi tiết, Lịch sử, Nút quay)
                if (!isRevealed)
                  Positioned(
                    bottom: 16,
                    left: 12,
                    right: 12,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Hàng các nút chức năng phụ chỉ icon (Đổi thẻ, Chi tiết, Lịch sử)
                        _buildSubIconButton(
                          icon: LucideIcons.repeat,
                          color: const Color(0xFF34D399),
                          tooltip: 'Đổi thẻ',
                          onTap: () => GachaExchangeModal.show(context),
                        ),
                        const SizedBox(width: 6),
                        _buildSubIconButton(
                          icon: LucideIcons.info,
                          color: const Color(0xFF38BDF8),
                          tooltip: 'Chi tiết',
                          onTap: () => GachaInfoModal.show(context),
                        ),
                        const SizedBox(width: 6),
                        _buildSubIconButton(
                          icon: LucideIcons.history,
                          color: const Color(0xFFA855F7),
                          tooltip: 'Lịch sử',
                          onTap: () => GachaHistoryModal.show(context),
                        ),
                        const SizedBox(width: 8),

                        // Nút Quay thẻ chính (Interactive Press/Hold) co giãn linh hoạt
                        Expanded(
                          child: Align(
                            alignment: Alignment.centerRight,
                            child: GachaRollButton(
                              isRolling: gachaState.isRolling,
                              isFreePullAvailable: gachaState.status.isFreePullAvailable,
                              userCoins: gachaState.status.freeCoins,
                              costPerRoll: gachaState.status.rollCost,
                              onRoll: (count) {
                                context.read<GachaBloc>().add(GachaRollRequested(count));
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildSubIconButton({
    required IconData icon,
    required Color color,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B).withValues(alpha: 0.85),
            shape: BoxShape.circle,
            border: Border.all(color: color.withValues(alpha: 0.35), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Center(
            child: Icon(icon, color: color, size: 20),
          ),
        ),
      ),
    );
  }
}
